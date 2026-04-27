'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Coins, Check, Lock, Sparkles, ShoppingBag, PackageOpen, Flame, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { CharacterAvatar } from '@/components/character/character-avatar';
import { cn } from '@/lib/utils';
import {
  SKINS, HAIR_STYLES, HAIR_COLORS, OUTFITS, ACCESSORIES,
  FREE_ITEM_IDS, DEFAULT_CHARACTER, RARITY_CFG,
  type CharacterConfig, type ShopItem, type ItemSlot,
} from '@/lib/character';
import CasesPage from '@/app/(app)/cases/page';

type TopTab = 'character' | 'cases';
type Tab = ItemSlot;

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'outfit',     label: 'Outfit',  emoji: '👕' },
  { id: 'accessory',  label: 'Doplňky', emoji: '💎' },
  { id: 'hair',       label: 'Vlasy',   emoji: '💇' },
  { id: 'hair_color', label: 'Barva',   emoji: '🎨' },
  { id: 'skin',       label: 'Skin',    emoji: '🟤' },
];

const SLOT_ITEMS: Record<Tab, ShopItem[]> = {
  skin:       SKINS,
  hair:       HAIR_STYLES,
  hair_color: HAIR_COLORS,
  outfit:     OUTFITS,
  accessory:  ACCESSORIES,
};

export default function CharacterPage() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const [topTab, setTopTab] = useState<TopTab>('character');

  const [ownedIds, setOwnedIds]     = useState<Set<string>>(FREE_ITEM_IDS);
  const [equipped, setEquipped]     = useState<CharacterConfig>(DEFAULT_CHARACTER);
  const equippedInitialized         = useRef(false);
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>('outfit');
  const [buying, setBuying]         = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!profile || equippedInitialized.current) return;
    equippedInitialized.current = true;
    setEquipped({
      skin:       (profile as any).character_skin       || DEFAULT_CHARACTER.skin,
      hair:       (profile as any).character_hair       || DEFAULT_CHARACTER.hair,
      hair_color: (profile as any).character_hair_color || DEFAULT_CHARACTER.hair_color,
      outfit:     (profile as any).character_outfit     || DEFAULT_CHARACTER.outfit,
      accessory:  (profile as any).character_accessory  || DEFAULT_CHARACTER.accessory,
    });
  }, [profile]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.from('owned_items').select('item_id');
      if (data) setOwnedIds(new Set([...FREE_ITEM_IDS, ...data.map((r: any) => r.item_id)]));
    })();
  }, []);

  const coins: number = (profile as any)?.coins ?? 0;

  const activeItems = SLOT_ITEMS[activeTab];
  const previewItem: ShopItem | null =
    (hoveredId  && activeItems.find((i) => i.id === hoveredId))  ||
    (selectedId && activeItems.find((i) => i.id === selectedId)) ||
    null;
  const previewConfig: CharacterConfig = previewItem
    ? { ...equipped, [previewItem.slot]: previewItem.id }
    : equipped;
  const selectedItem: ShopItem | null =
    (selectedId && activeItems.find((i) => i.id === selectedId)) || null;

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  function handleEquip(item: ShopItem) {
    setEquipped((prev) => ({ ...prev, [item.slot]: item.id }));
    setSelectedId(null);
    startTransition(() => {
      const supabase = createClient();
      void supabase.rpc('equip_item', { p_slot: item.slot, p_item_id: item.id }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      });
    });
  }

  async function handleBuy(item: ShopItem) {
    const supabase = createClient();
    if (coins < item.price) { showToast('Nedostatek SM coinů 😢', 'error'); return; }
    setBuying(item.id);
    const { data: ok } = await supabase.rpc('buy_item', { p_item_id: item.id, p_price: item.price });
    setBuying(null);
    if (!ok) { showToast('Nákup se nezdařil', 'error'); return; }
    setOwnedIds((prev) => new Set([...prev, item.id]));
    showToast(`✦ ${item.label} odemčeno!`);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    handleEquip(item);
  }

  function handleItemClick(item: ShopItem) {
    if (ownedIds.has(item.id)) {
      handleEquip(item);
    } else {
      setSelectedId(selectedId === item.id ? null : item.id);
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSelectedId(null);
    setHoveredId(null);
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-5xl">
        <div className="h-9 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-[480px] bg-zinc-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5">

      {/* Top tab switcher */}
      <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
        <button
          onClick={() => setTopTab('character')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            topTab === 'character' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300',
          )}
        >
          <Sparkles className="w-3.5 h-3.5" /> Postava
        </button>
        <button
          onClick={() => setTopTab('cases')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            topTab === 'cases' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300',
          )}
        >
          <PackageOpen className="w-3.5 h-3.5" /> SM Bedny
        </button>
      </div>

      {topTab === 'cases' && <CasesPage />}

      {topTab === 'character' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Moje postava</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Nakupuj itemy a přizpůsob svůj avatar</p>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex-shrink-0">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-lg font-black text-amber-400 tabular-nums">{coins.toLocaleString()}</span>
              <span className="text-xs text-zinc-500 hidden sm:block">SM coinů</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[290px,1fr] gap-5">

            {/* ── Left: character panel ── */}
            <div className="flex flex-col gap-3">

              {/* Spotlight card */}
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Accent stripe top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                {/* Floor glow */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(139,92,246,0.2) 0%, transparent 70%)' }}
                />

                {/* Try-on banner */}
                {previewItem && !ownedIds.has(previewItem.id) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/15 border-b border-violet-500/20">
                    <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">Zkouška</span>
                    <span className="text-[10px] text-zinc-500 ml-auto truncate">{previewItem.label}</span>
                  </div>
                )}

                {/* Avatar */}
                <div className="flex flex-col items-center py-6 relative z-10">
                  <CharacterAvatar config={previewConfig} size={190} />
                  <p className="text-sm font-bold text-white mt-3">
                    {profile?.display_name || profile?.username || 'Bettor'}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Tvůj avatar</p>
                </div>

                {/* ── Equipped slots strip ── */}
                <div className="border-t border-zinc-800 grid grid-cols-5 divide-x divide-zinc-800">
                  {TABS.map((tab) => {
                    const equippedItem = SLOT_ITEMS[tab.id].find((i) => i.id === equipped[tab.id]);
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          'group flex flex-col items-center gap-1 py-3 px-1 transition-all relative',
                          isActive
                            ? 'bg-violet-500/10 text-violet-300'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
                        )}
                      >
                        {isActive && (
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
                        )}
                        {equippedItem?.color ? (
                          <div
                            className="w-5 h-5 rounded-full border border-white/15 flex-shrink-0"
                            style={{ background: equippedItem.color }}
                          />
                        ) : (
                          <span className="text-base leading-none">
                            {equippedItem?.emoji ?? tab.emoji}
                          </span>
                        )}
                        <span className="text-[9px] font-semibold uppercase tracking-wide leading-none">
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="w-3 h-0.5 bg-violet-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buy confirmation panel */}
              {selectedItem && !ownedIds.has(selectedItem.id) && (
                <BuyPanel
                  item={selectedItem}
                  coins={coins}
                  buying={buying}
                  onBuy={handleBuy}
                />
              )}

              {/* Earn coins info */}
              <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 text-xs text-zinc-500 space-y-1.5">
                <p className="font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Jak získat coiny
                </p>
                <p>✦ Common achievement → <span className="text-zinc-300">50 coinů</span></p>
                <p>✦ Rare achievement → <span className="text-zinc-300">150 coinů</span></p>
                <p>✦ Epic achievement → <span className="text-zinc-300">300 coinů</span></p>
                <p>✦ Legendary achievement → <span className="text-zinc-300">500 coinů</span></p>
                <p>✦ Každá sázka → <span className="text-zinc-300">2 coiny</span></p>
                <p>✦ Každá výhra → <span className="text-zinc-300">5 coinů</span></p>
              </div>
            </div>

            {/* ── Right: shop panel ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">

              {/* Category tabs */}
              <div className="flex border-b border-zinc-800 overflow-x-auto flex-shrink-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex-1 min-w-[70px] px-3 py-3 text-xs font-semibold transition-all whitespace-nowrap flex flex-col items-center gap-0.5 relative',
                      activeTab === tab.id
                        ? 'text-white border-b-2 border-violet-500 bg-violet-500/5'
                        : 'text-zinc-500 hover:text-zinc-300',
                    )}
                  >
                    <span className="text-lg leading-none">{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Items grid */}
              <div
                className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto"
                style={{ maxHeight: 540 }}
              >
                {activeItems.map((item) => (
                  <ShopCard
                    key={item.id}
                    item={item}
                    isOwned={ownedIds.has(item.id)}
                    isEquipped={equipped[item.slot] === item.id}
                    isSelected={selectedId === item.id}
                    canAfford={coins >= item.price}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className={cn(
              'fixed bottom-6 left-1/2 -translate-x-1/2 text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 border',
              toast.type === 'error'
                ? 'bg-red-950 border-red-800/50 text-red-300'
                : 'bg-zinc-800 border-zinc-700 text-white',
            )}>
              {toast.msg}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Shop card ──────────────────────────────────────────── */

interface ShopCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function ShopCard({ item, isOwned, isEquipped, isSelected, canAfford, onClick, onMouseEnter, onMouseLeave }: ShopCardProps) {
  const rarity = item.rarity ?? 'common';
  const rCfg   = RARITY_CFG[rarity];
  const isDrip = item.sublabel === 'Drip';

  const rarityTopBar: Record<string, string> = {
    legendary: 'from-transparent via-amber-400/80 to-transparent',
    epic:      'from-transparent via-purple-400/80 to-transparent',
    rare:      'from-transparent via-blue-400/70 to-transparent',
    common:    '',
  };

  const equippedBorder: Record<string, string> = {
    legendary: 'border-amber-500/50 bg-amber-500/8 ring-1 ring-amber-500/20',
    epic:      'border-purple-500/50 bg-purple-500/8 ring-1 ring-purple-500/20',
    rare:      'border-blue-500/50 bg-blue-500/8 ring-1 ring-blue-500/20',
    common:    'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/20',
  };

  const equippedTextColor: Record<string, string> = {
    legendary: 'text-amber-300',
    epic:      'text-purple-300',
    rare:      'text-blue-300',
    common:    'text-violet-300',
  };

  const equippedStatusColor: Record<string, string> = {
    legendary: 'text-amber-400',
    epic:      'text-purple-400',
    rare:      'text-blue-400',
    common:    'text-violet-400',
  };

  const equippedCheckBg: Record<string, string> = {
    legendary: 'bg-amber-500',
    epic:      'bg-purple-500',
    rare:      'bg-blue-500',
    common:    'bg-violet-500',
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={!isOwned && !canAfford && !isSelected}
      style={
        isEquipped && rarity !== 'common'
          ? { boxShadow: rCfg.glow }
          : undefined
      }
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-150 group overflow-hidden',
        isEquipped
          ? equippedBorder[rarity]
          : isSelected
          ? 'border-violet-400/60 bg-violet-500/5 ring-1 ring-violet-400/20'
          : isOwned
          ? 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800'
          : canAfford
          ? 'border-zinc-800 bg-zinc-800/30 hover:border-violet-500/40 hover:bg-zinc-800/60 cursor-pointer'
          : 'border-zinc-800/50 bg-zinc-900/20 opacity-40 cursor-not-allowed',
      )}
    >
      {/* Rarity top bar */}
      {rarityTopBar[rarity] && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-px bg-gradient-to-r',
          rarityTopBar[rarity],
        )} />
      )}

      {/* Equipped check */}
      {isEquipped && (
        <div className={cn('absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center', equippedCheckBg[rarity])}>
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* DRIP badge */}
      {isDrip && (
        <div className="absolute top-1.5 left-1.5">
          <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wide text-orange-400 bg-orange-500/15 border border-orange-500/20 px-1 py-0.5 rounded">
            <Flame className="w-2 h-2" />DRIP
          </span>
        </div>
      )}

      {/* TRY badge on hover */}
      {!isOwned && !isEquipped && canAfford && !isDrip && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            Try
          </span>
        </div>
      )}

      {/* Item icon */}
      <ItemIcon item={item} size="md" />

      {/* Name + rarity */}
      <div className="w-full space-y-0.5">
        <p className={cn(
          'text-xs font-semibold leading-tight truncate',
          isEquipped ? equippedTextColor[rarity] : isOwned ? 'text-zinc-200' : 'text-zinc-400',
        )}>
          {item.label}
        </p>
        <p className={cn('text-[9px] font-bold uppercase tracking-widest', rCfg.color)}>
          {rCfg.label}
        </p>
      </div>

      {/* Price / status */}
      {isEquipped ? (
        <span className={cn('text-[10px] font-bold uppercase tracking-wide', equippedStatusColor[rarity])}>
          Nasazeno
        </span>
      ) : isOwned ? (
        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">Nasadit →</span>
      ) : item.price === 0 ? (
        <span className="text-[10px] text-emerald-500 font-semibold">Zdarma</span>
      ) : (
        <div className="flex items-center gap-1">
          {!canAfford && <Lock className="w-2.5 h-2.5 text-zinc-600" />}
          <Coins className={cn('w-3 h-3', canAfford ? 'text-amber-400' : 'text-zinc-600')} />
          <span className={cn('text-[11px] font-bold tabular-nums', canAfford ? 'text-amber-400' : 'text-zinc-600')}>
            {item.price.toLocaleString()}
          </span>
        </div>
      )}
    </button>
  );
}

/* ─── Buy panel ──────────────────────────────────────────── */

function BuyPanel({ item, coins, buying, onBuy }: {
  item: ShopItem;
  coins: number;
  buying: string | null;
  onBuy: (item: ShopItem) => void;
}) {
  const rarity  = item.rarity ?? 'common';
  const rCfg    = RARITY_CFG[rarity];
  const isDrip  = item.sublabel === 'Drip';
  const canAfford = coins >= item.price;

  const panelBorder: Record<string, string> = {
    legendary: 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent',
    epic:      'border-purple-500/40 bg-gradient-to-b from-purple-500/5 to-transparent',
    rare:      'border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-transparent',
    common:    'border-zinc-700',
  };

  return (
    <div className={cn('bg-zinc-900 border rounded-2xl p-4 space-y-3 relative overflow-hidden', panelBorder[rarity])}>
      {rarity !== 'common' && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-px bg-gradient-to-r',
          rarity === 'legendary' ? 'from-transparent via-amber-400/60 to-transparent'
          : rarity === 'epic'    ? 'from-transparent via-purple-400/60 to-transparent'
          :                        'from-transparent via-blue-400/60 to-transparent',
        )} />
      )}

      <div className="flex items-center gap-3">
        <ItemIcon item={item} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-white text-sm leading-tight">{item.label}</p>
            {isDrip && (
              <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-orange-400 bg-orange-500/15 border border-orange-500/20 px-1.5 py-0.5 rounded">
                <Flame className="w-2.5 h-2.5" /> DRIP
              </span>
            )}
            {item.sublabel && !isDrip && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {item.sublabel}
              </span>
            )}
          </div>
          <p className={cn('text-xs font-semibold capitalize mt-0.5', rCfg.color)}>
            {rCfg.label}
          </p>
        </div>
      </div>

      <button
        onClick={() => onBuy(item)}
        disabled={buying === item.id || !canAfford}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
          canAfford
            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-[0.98]'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
        )}
      >
        {buying === item.id ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Coins className="w-4 h-4 text-amber-400" />
            Koupit za {item.price.toLocaleString()} coinů
            {canAfford && <ChevronRight className="w-4 h-4 opacity-60" />}
          </>
        )}
      </button>

      {!canAfford && (
        <p className="text-center text-[11px] text-zinc-600">
          Chybí {(item.price - coins).toLocaleString()} coinů
        </p>
      )}
    </div>
  );
}

/* ─── Item icon ──────────────────────────────────────────── */

function ItemIcon({ item, size }: { item: ShopItem; size: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-14 h-14 rounded-xl text-3xl' : 'w-12 h-12 rounded-xl text-2xl';

  if (item.emoji) {
    return (
      <div className={cn('flex items-center justify-center bg-zinc-800 flex-shrink-0', cls)}>
        {item.emoji}
      </div>
    );
  }
  if (item.color) {
    return (
      <div
        className={cn('border border-white/10 flex-shrink-0', cls)}
        style={{ background: item.color }}
      />
    );
  }
  return (
    <div className={cn('flex items-center justify-center bg-zinc-800 text-zinc-500 flex-shrink-0', cls)}>
      ?
    </div>
  );
}
