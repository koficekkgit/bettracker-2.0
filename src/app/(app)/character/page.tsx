'use client';

import { useState, useEffect, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Coins, Check, Lock, Sparkles, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { CharacterAvatar } from '@/components/character/character-avatar';
import { cn } from '@/lib/utils';
import {
  SKINS, HAIR_STYLES, HAIR_COLORS, OUTFITS, ACCESSORIES,
  FREE_ITEM_IDS, DEFAULT_CHARACTER, RARITY_CFG,
  type CharacterConfig, type ShopItem, type ItemSlot,
} from '@/lib/character';

type Tab = ItemSlot;

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'outfit',     label: 'Outfit',   emoji: '👕' },
  { id: 'accessory',  label: 'Doplňky', emoji: '💎' },
  { id: 'hair',       label: 'Vlasy',    emoji: '💇' },
  { id: 'hair_color', label: 'Barva',    emoji: '🎨' },
  { id: 'skin',       label: 'Skin',     emoji: '🟤' },
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

  const [ownedIds, setOwnedIds]         = useState<Set<string>>(FREE_ITEM_IDS);
  const [equipped, setEquipped]         = useState<CharacterConfig>(DEFAULT_CHARACTER);
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<Tab>('outfit');
  const [buying, setBuying]             = useState<string | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

  // Sync profile → equipped once loaded
  useEffect(() => {
    if (!profile) return;
    setEquipped({
      skin:       (profile as any).character_skin       || DEFAULT_CHARACTER.skin,
      hair:       (profile as any).character_hair       || DEFAULT_CHARACTER.hair,
      hair_color: (profile as any).character_hair_color || DEFAULT_CHARACTER.hair_color,
      outfit:     (profile as any).character_outfit     || DEFAULT_CHARACTER.outfit,
      accessory:  (profile as any).character_accessory  || DEFAULT_CHARACTER.accessory,
    });
  }, [profile]);

  // Fetch owned items
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.from('owned_items').select('item_id');
      if (data) {
        setOwnedIds(new Set([...FREE_ITEM_IDS, ...data.map((r: any) => r.item_id)]));
      }
    })();
  }, []);

  const coins: number = (profile as any)?.coins ?? 0;

  // Build live preview config: hovered item takes priority, then selected
  const activeItems = SLOT_ITEMS[activeTab];
  const previewItem: ShopItem | null =
    (hoveredId && activeItems.find((i) => i.id === hoveredId)) ||
    (selectedId && activeItems.find((i) => i.id === selectedId)) ||
    null;
  const previewConfig: CharacterConfig = previewItem
    ? { ...equipped, [previewItem.slot]: previewItem.id }
    : equipped;

  const selectedItem: ShopItem | null =
    (selectedId && activeItems.find((i) => i.id === selectedId)) || null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleEquip(item: ShopItem) {
    setEquipped((prev) => ({ ...prev, [item.slot]: item.id }));
    setSelectedId(null);
    startTransition(() => {
      const supabase = createClient();
      void supabase.rpc('equip_item', { p_slot: item.slot, p_item_id: item.id });
    });
  }

  async function handleBuy(item: ShopItem) {
    const supabase = createClient();
    if (coins < item.price) { showToast('Nedostatek SM coinů 😢'); return; }
    setBuying(item.id);
    const { data: ok } = await supabase.rpc('buy_item', { p_item_id: item.id, p_price: item.price });
    setBuying(null);
    if (!ok) { showToast('Nákup se nezdařil'); return; }
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

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-5">

        {/* ── Left: character panel ── */}
        <div className="flex flex-col gap-3">

          {/* Character spotlight card */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Gradient floor glow */}
            <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />

            {/* Try-on banner */}
            {previewItem && !ownedIds.has(previewItem.id) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/15 border-b border-violet-500/25">
                <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">Zkouška</span>
                <span className="text-[10px] text-zinc-400 ml-auto truncate">{previewItem.label}</span>
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
          </div>

          {/* Buy confirmation panel — shown when unowned item is selected */}
          {selectedItem && !ownedIds.has(selectedItem.id) && (
            <div className={cn(
              'bg-zinc-900 border rounded-2xl p-4 space-y-3',
              selectedItem.rarity === 'legendary' ? 'border-amber-500/40 bg-amber-500/3' :
              selectedItem.rarity === 'epic'      ? 'border-purple-500/40 bg-purple-500/3' :
              selectedItem.rarity === 'rare'      ? 'border-blue-500/40 bg-blue-500/3' :
              'border-zinc-700',
            )}>
              <div className="flex items-center gap-3">
                <ItemIcon item={selectedItem} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-white text-sm leading-tight">{selectedItem.label}</p>
                    {selectedItem.sublabel && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {selectedItem.sublabel}
                      </span>
                    )}
                  </div>
                  <p className={cn('text-xs font-semibold capitalize mt-0.5', RARITY_CFG[selectedItem.rarity ?? 'common'].color)}>
                    {RARITY_CFG[selectedItem.rarity ?? 'common'].label}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleBuy(selectedItem)}
                disabled={buying === selectedItem.id || coins < selectedItem.price}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
                  coins >= selectedItem.price
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
                )}
              >
                {buying === selectedItem.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-amber-400" />
                    Koupit za {selectedItem.price.toLocaleString()} coinů
                  </>
                )}
              </button>

              {coins < selectedItem.price && (
                <p className="text-center text-[11px] text-zinc-600">
                  Chybí {(selectedItem.price - coins).toLocaleString()} coinů
                </p>
              )}
            </div>
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
                  'flex-1 min-w-[70px] px-3 py-3 text-xs font-semibold transition-colors whitespace-nowrap flex flex-col items-center gap-0.5',
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
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto" style={{ maxHeight: 520 }}>
            {activeItems.map((item) => {
              const isOwned    = ownedIds.has(item.id);
              const isEquipped = equipped[item.slot] === item.id;
              const isSelected = selectedId === item.id;
              const canAfford  = coins >= item.price;
              const rarity     = item.rarity ?? 'common';
              const rCfg       = RARITY_CFG[rarity];

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  disabled={!isOwned && !canAfford && !isSelected}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-150 group',
                    isEquipped
                      ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/20'
                      : isSelected
                      ? 'border-violet-400/60 bg-violet-500/5 ring-1 ring-violet-400/20'
                      : isOwned
                      ? 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800'
                      : canAfford
                      ? 'border-zinc-800 bg-zinc-800/30 hover:border-violet-500/40 hover:bg-zinc-800/60 cursor-pointer'
                      : 'border-zinc-800/50 bg-zinc-900/20 opacity-40 cursor-not-allowed',
                  )}
                >
                  {/* Rarity dot */}
                  <div className={cn('absolute top-2 left-2 w-1.5 h-1.5 rounded-full', rCfg.dot)} />

                  {/* Equipped check */}
                  {isEquipped && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* TRY badge on hover for unowned */}
                  {!isOwned && !isEquipped && canAfford && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-bold text-violet-300 bg-violet-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Try
                      </span>
                    </div>
                  )}

                  {/* Item icon */}
                  <ItemIcon item={item} size="md" />

                  {/* Name */}
                  <div className="w-full space-y-0.5">
                    <p className={cn(
                      'text-xs font-semibold leading-tight truncate',
                      isEquipped ? 'text-violet-300' : isOwned ? 'text-zinc-200' : 'text-zinc-400',
                    )}>
                      {item.label}
                    </p>
                    {item.sublabel && (
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wide">{item.sublabel}</p>
                    )}
                  </div>

                  {/* Rarity label */}
                  <p className={cn('text-[9px] font-bold uppercase tracking-widest', rCfg.color)}>
                    {rCfg.label}
                  </p>

                  {/* Status / price */}
                  {isEquipped ? (
                    <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wide">Nasazeno</span>
                  ) : isOwned ? (
                    <span className="text-[10px] text-zinc-500">Nasadit</span>
                  ) : item.price === 0 ? (
                    <span className="text-[10px] text-emerald-500">Zdarma</span>
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
    <div className={cn('flex items-center justify-center bg-zinc-800 text-zinc-500 flex-shrink-0', cls)}>?</div>
  );
}
