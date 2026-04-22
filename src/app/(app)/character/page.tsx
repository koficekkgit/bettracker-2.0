'use client';

import { useState, useEffect, useOptimistic, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Coins, Check, Lock, Sparkles, ShoppingBag, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { CharacterAvatar } from '@/components/character/character-avatar';
import { cn } from '@/lib/utils';
import {
  SKINS, HAIR_STYLES, HAIR_COLORS, OUTFITS, ACCESSORIES,
  FREE_ITEM_IDS, DEFAULT_CHARACTER,
  type CharacterConfig, type ShopItem,
} from '@/lib/character';

// ─── types ──────────────────────────────────────────────────
type Tab = 'skin' | 'hair' | 'hair_color' | 'outfit' | 'accessory';

const TABS: { id: Tab; label: string }[] = [
  { id: 'skin',       label: 'Skin'      },
  { id: 'hair',       label: 'Vlasy'     },
  { id: 'hair_color', label: 'Barva'     },
  { id: 'outfit',     label: 'Outfit'    },
  { id: 'accessory',  label: 'Doplňky'  },
];

// ─── main page ──────────────────────────────────────────────
export default function CharacterPage() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Owned item IDs fetched from DB
  const [ownedIds, setOwnedIds] = useState<Set<string>>(FREE_ITEM_IDS);

  // Local preview state (mirrors what's equipped)
  const [preview, setPreview] = useState<CharacterConfig>(DEFAULT_CHARACTER);
  const [activeTab, setActiveTab] = useState<Tab>('skin');
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sync profile → preview once loaded
  useEffect(() => {
    if (!profile) return;
    setPreview({
      skin:       (profile as any).character_skin       || DEFAULT_CHARACTER.skin,
      hair:       (profile as any).character_hair       || DEFAULT_CHARACTER.hair,
      hair_color: (profile as any).character_hair_color || DEFAULT_CHARACTER.hair_color,
      outfit:     (profile as any).character_outfit     || DEFAULT_CHARACTER.outfit,
      accessory:  (profile as any).character_accessory  || DEFAULT_CHARACTER.accessory,
    });
  }, [profile]);

  // Fetch owned items from DB
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.from('owned_items').select('item_id');
      if (data) {
        setOwnedIds(new Set([...FREE_ITEM_IDS, ...data.map((r) => r.item_id)]));
      }
    })();
  }, []);

  const coins: number = (profile as any)?.coins ?? 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSelectItem(item: ShopItem) {
    const supabase = createClient();
    const isOwned = ownedIds.has(item.id);

    // Need to buy first
    if (!isOwned) {
      if (coins < item.price) {
        showToast('Nedostatek SM coinů 😢');
        return;
      }
      setBuying(item.id);
      const { data: ok } = await supabase.rpc('buy_item', {
        p_item_id: item.id,
        p_price: item.price,
      });
      setBuying(null);
      if (!ok) { showToast('Nákup se nezdařil'); return; }
      setOwnedIds((prev) => new Set([...prev, item.id]));
      showToast(`✦ ${item.label} odemčeno!`);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }

    // Equip immediately
    const slot = item.slot;
    setPreview((p) => ({ ...p, [slot]: item.id }));
    startTransition(() => {
      void supabase.rpc('equip_item', { p_slot: slot, p_item_id: item.id });
    });
  }

  const currentItems: ShopItem[] = {
    skin:       SKINS,
    hair:       HAIR_STYLES,
    hair_color: HAIR_COLORS,
    outfit:     OUTFITS,
    accessory:  ACCESSORIES,
  }[activeTab];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-9 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-96 bg-zinc-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <User className="w-7 h-7 text-violet-400" />
          Moje postava
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Přizpůsob svého avatara a utrať SM coiny v obchodě
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">

        {/* ── Left: preview panel ── */}
        <div className="flex flex-col gap-4">
          {/* Character display */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center gap-4">
            {/* Avatar with glow */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.2) 0%, transparent 70%)' }}
              />
              <CharacterAvatar config={preview} size={160} />
            </div>

            {/* Display name */}
            <div className="text-center">
              <p className="font-bold text-white">{profile?.display_name || profile?.username || 'Bettor'}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Tvůj avatar</p>
            </div>
          </div>

          {/* Coin balance */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-black text-amber-400 tabular-nums leading-none">
                {coins.toLocaleString()}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">SM coinů</p>
            </div>
            <div className="ml-auto">
              <Sparkles className="w-4 h-4 text-amber-500/40" />
            </div>
          </div>

          {/* How to earn */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 text-xs text-zinc-500 space-y-1.5">
            <p className="font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Jak získat coiny
            </p>
            <p>✦ Achievement Common → <span className="text-zinc-300">50 coinů</span></p>
            <p>✦ Achievement Rare → <span className="text-zinc-300">150 coinů</span></p>
            <p>✦ Achievement Epic → <span className="text-zinc-300">300 coinů</span></p>
            <p>✦ Achievement Legendary → <span className="text-zinc-300">500 coinů</span></p>
            <p>✦ Každá sázka → <span className="text-zinc-300">2 coiny</span></p>
            <p>✦ Každá výhra → <span className="text-zinc-300">5 coinů</span></p>
          </div>
        </div>

        {/* ── Right: shop panel ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-zinc-800 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 min-w-[80px] px-4 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-violet-500 bg-violet-500/5'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentItems.map((item) => {
              const isOwned    = ownedIds.has(item.id);
              const isEquipped = preview[item.slot] === item.id;
              const canAfford  = coins >= item.price;
              const isBuying   = buying === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  disabled={isBuying}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-150',
                    isEquipped
                      ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30'
                      : isOwned
                        ? 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800'
                        : canAfford
                          ? 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-800/60'
                          : 'border-zinc-800/50 bg-zinc-900/20 opacity-50 cursor-not-allowed',
                  )}
                >
                  {/* Equipped badge */}
                  {isEquipped && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Preview */}
                  <ItemPreview item={item} />

                  {/* Name */}
                  <span className={cn(
                    'text-xs font-semibold leading-tight',
                    isEquipped ? 'text-violet-300' : isOwned ? 'text-zinc-200' : 'text-zinc-400',
                  )}>
                    {item.label}
                  </span>

                  {/* Price / owned / equipped */}
                  {isEquipped ? (
                    <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wide">Nasazeno</span>
                  ) : isOwned ? (
                    <span className="text-[10px] text-zinc-500">Vlastněno</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {!canAfford && <Lock className="w-2.5 h-2.5 text-zinc-600" />}
                      <Coins className={cn('w-3 h-3', canAfford ? 'text-amber-400' : 'text-zinc-600')} />
                      <span className={cn('text-[11px] font-bold tabular-nums', canAfford ? 'text-amber-400' : 'text-zinc-600')}>
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Buying spinner */}
                  {isBuying && (
                    <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}

function ItemPreview({ item }: { item: ShopItem }) {
  // Color swatch for skin/hair_color/outfit
  if (item.color) {
    return (
      <div
        className="w-10 h-10 rounded-lg border-2 border-white/10 flex-shrink-0"
        style={{ background: item.color }}
      />
    );
  }

  // Hair style mini preview (simple text icon)
  const HAIR_ICONS: Record<string, string> = {
    hair_none:   '○',
    hair_short:  '◠',
    hair_spiky:  '⚡',
    hair_long:   '♜',
    hair_curly:  '〜',
    hair_mohawk: '▲',
    hair_bun:    '●',
  };

  // Accessory emoji
  const ACC_ICONS: Record<string, string> = {
    acc_none:       '—',
    acc_glasses:    '👓',
    acc_cap:        '🧢',
    acc_headphones: '🎧',
    acc_halo:       '✨',
    acc_crown:      '👑',
    acc_trophy:     '🏆',
  };

  const icon =
    HAIR_ICONS[item.id] ??
    ACC_ICONS[item.id] ??
    '?';

  return (
    <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center text-lg flex-shrink-0">
      {icon}
    </div>
  );
}
