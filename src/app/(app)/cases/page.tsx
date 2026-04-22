'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Coins, Package, X, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';
import { RARITY_CFG, type ShopItem } from '@/lib/character';
import { CASES, rollCaseItem, buildStrip, WINNER_IDX, type CaseDef } from '@/lib/cases';

// ── Constants ────────────────────────────────────────────────

const ITEM_W  = 120;           // px per item (card + gap)
const VISIBLE = 5;             // items visible in the viewport window
const VP_W    = ITEM_W * VISIBLE; // 600px viewport width
const SPIN_MS = 5400;
const EASE    = 'cubic-bezier(0.04, 0.85, 0.1, 1)';

// ── Helpers ──────────────────────────────────────────────────

const RARITY_STRIP: Record<string, string> = {
  common:    'border-zinc-600   bg-zinc-800',
  rare:      'border-blue-500/70 bg-blue-950/60',
  epic:      'border-purple-500/70 bg-purple-950/60',
  legendary: 'border-amber-400/80 bg-amber-950/60',
};

const RARITY_GLOW: Record<string, string> = {
  common:    '',
  rare:      '0 0 18px rgba(96,165,250,0.5)',
  epic:      '0 0 20px rgba(168,85,247,0.55)',
  legendary: '0 0 28px rgba(251,191,36,0.7)',
};

// ── Strip item card ──────────────────────────────────────────

function StripCard({ item, highlight }: { item: ShopItem; highlight: boolean }) {
  const rarity = item.rarity ?? 'common';
  return (
    <div
      className={cn(
        'flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 select-none',
        RARITY_STRIP[rarity],
        highlight && 'scale-105',
      )}
      style={{
        width:       ITEM_W - 8,
        height:      110,
        marginRight: 8,
        boxShadow:   highlight ? RARITY_GLOW[rarity] : undefined,
        transition:  'box-shadow 0.3s',
      }}
    >
      {item.emoji ? (
        <span className="text-3xl leading-none">{item.emoji}</span>
      ) : item.color ? (
        <div className="w-9 h-9 rounded-lg border border-white/15" style={{ background: item.color }} />
      ) : (
        <span className="text-xl">?</span>
      )}
      <p className="text-[10px] font-semibold text-zinc-300 px-1 truncate w-full text-center leading-tight">
        {item.label}
      </p>
      <p className={cn('text-[9px] font-bold uppercase tracking-wide', RARITY_CFG[rarity].color)}>
        {RARITY_CFG[rarity].label}
      </p>
    </div>
  );
}

// ── Result card ──────────────────────────────────────────────

function ResultCard({ winner, onClose }: { winner: ShopItem; onClose: () => void }) {
  const rarity  = winner.rarity ?? 'common';
  const [equipped, setEquipped] = useState(false);

  async function handleEquip() {
    const supabase = createClient();
    await supabase.rpc('equip_item', { p_slot: winner.slot, p_item_id: winner.id });
    setEquipped(true);
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3',
        rarity === 'legendary' ? 'border-amber-400/70 bg-amber-950/40' :
        rarity === 'epic'      ? 'border-purple-500/60 bg-purple-950/40' :
        rarity === 'rare'      ? 'border-blue-500/50 bg-blue-950/40' :
        'border-zinc-600 bg-zinc-800/60',
      )}
      style={{ boxShadow: RARITY_GLOW[rarity] || undefined }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-zinc-900 border border-zinc-700">
        {winner.emoji ? (
          <span className="text-2xl">{winner.emoji}</span>
        ) : winner.color ? (
          <div className="w-8 h-8 rounded-lg border border-white/15" style={{ background: winner.color }} />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black text-white">{winner.label}</p>
        {winner.sublabel && <p className="text-xs text-zinc-500 uppercase tracking-wide">{winner.sublabel}</p>}
        <p className={cn('text-xs font-bold uppercase tracking-widest mt-0.5', RARITY_CFG[rarity].color)}>
          {RARITY_CFG[rarity].label}
        </p>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        {!equipped ? (
          <button
            onClick={handleEquip}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all"
          >
            Nasadit
          </button>
        ) : (
          <span className="px-4 py-2 rounded-lg text-xs font-bold text-emerald-400">✓ Nasazeno</span>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}

// ── Spin modal ───────────────────────────────────────────────

function SpinModal({
  caseDef,
  onClose,
  onCoinChange,
}: {
  caseDef: CaseDef;
  onClose: () => void;
  onCoinChange: () => void;
}) {
  type Phase = 'idle' | 'spinning' | 'done' | 'error';

  const [phase,      setPhase]      = useState<Phase>('idle');
  const [winner,     setWinner]     = useState<ShopItem | null>(null);
  const [strip,      setStrip]      = useState<ShopItem[]>([]);
  const [finalX,     setFinalX]     = useState(0);
  const [errMsg,     setErrMsg]     = useState('');
  const stripRef                    = useRef<HTMLDivElement>(null);
  const queryClient                 = useQueryClient();

  // Start animation only AFTER the strip has been rendered into the DOM
  useEffect(() => {
    if (phase !== 'spinning' || !stripRef.current || strip.length === 0) return;

    const el = stripRef.current;

    // Reset to start (no transition)
    el.style.transition = 'none';
    el.style.transform  = 'translateX(0px)';

    // Two rAFs: first to flush the reset, second to begin the transition
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        el.style.transition = `transform ${SPIN_MS}ms ${EASE}`;
        el.style.transform  = `translateX(${finalX}px)`;
      });
      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, strip]);

  const handleOpen = useCallback(async () => {
    const supabase = createClient();

    // Roll winner first
    const won = rollCaseItem(caseDef);

    // Deduct coins + grant item atomically
    const { data: ok } = await supabase.rpc('open_case', {
      p_item_id:   won.id,
      p_case_cost: caseDef.price,
    });

    if (!ok) {
      setErrMsg('Nedostatek SM coinů 😢');
      setPhase('error');
      return;
    }

    // Build the visual strip with the winner at WINNER_IDX
    const s = buildStrip(caseDef, won);

    // Compute where to stop so item[WINNER_IDX] is centred in the viewport.
    //
    // With translateX(tx) and no padding:
    //   position of item[i]'s centre in viewport = tx + i*ITEM_W + ITEM_W/2
    //
    // We want that to equal VP_W/2 (viewport centre):
    //   tx = VP_W/2 - WINNER_IDX*ITEM_W - ITEM_W/2
    //
    // A small random sub-item offset (±20 px) varies where exactly it stops.
    const subOff = (Math.random() - 0.5) * 40;
    const tx     = VP_W / 2 - WINNER_IDX * ITEM_W - ITEM_W / 2 + subOff;

    setStrip(s);
    setWinner(won);
    setFinalX(tx);
    setPhase('spinning');   // triggers the useEffect above

    // Mark as done after the animation finishes
    setTimeout(() => {
      setPhase('done');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      onCoinChange();
    }, SPIN_MS + 100);
  }, [caseDef, queryClient, onCoinChange]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-zinc-800"
          style={{ background: `linear-gradient(135deg, ${caseDef.accentFrom}80, ${caseDef.accentTo}80)` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{caseDef.emoji}</span>
            <div>
              <p className="font-black text-white">{caseDef.name}</p>
              <p className="text-xs text-zinc-400">{caseDef.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={phase === 'spinning'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-6 space-y-5">

          {/* Idle state */}
          {phase === 'idle' && (
            <div className="text-center py-8 space-y-2">
              <span className="text-7xl drop-shadow-lg">{caseDef.emoji}</span>
              <p className="text-zinc-400 text-sm mt-3">Klikni a otevři bednu!</p>
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <div className="text-center py-8 space-y-2">
              <p className="text-4xl">😢</p>
              <p className="text-red-400 font-semibold">{errMsg}</p>
            </div>
          )}

          {/* Reel — rendered during spinning and done */}
          {(phase === 'spinning' || phase === 'done') && (
            <div className="relative mx-auto" style={{ width: VP_W }}>

              {/* Center indicator */}
              <div
                className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 z-10 pointer-events-none"
                style={{ background: '#facc15', boxShadow: '0 0 8px rgba(250,204,21,0.9)' }}
              />

              {/* Fade overlays */}
              <div className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to right, #18181b, transparent)' }} />
              <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, #18181b, transparent)' }} />

              {/* Reel window */}
              <div className="overflow-hidden rounded-xl" style={{ height: 126 }}>
                <div ref={stripRef} className="flex" style={{ willChange: 'transform' }}>
                  {strip.map((item, i) => (
                    <StripCard
                      key={i}
                      item={item}
                      highlight={phase === 'done' && i === WINNER_IDX}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Result card after spin */}
          {phase === 'done' && winner && (
            <ResultCard winner={winner} onClose={onClose} />
          )}

          {/* Open button */}
          {phase === 'idle' && (
            <button
              onClick={handleOpen}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-400 text-black transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25"
            >
              <Sparkles className="w-4 h-4" />
              Otevřít za
              <Coins className="w-4 h-4" />
              {caseDef.price.toLocaleString()} coinů
            </button>
          )}

          {/* Spinning indicator */}
          {phase === 'spinning' && (
            <div className="flex items-center justify-center gap-2 py-3 text-zinc-500 text-sm font-semibold">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
              Otevírám bednu...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bedna card ───────────────────────────────────────────────

function BednaCard({ caseDef, coins, onOpen }: { caseDef: CaseDef; coins: number; onOpen: (c: CaseDef) => void }) {
  const canAfford = coins >= caseDef.price;

  return (
    <button
      onClick={() => onOpen(caseDef)}
      disabled={!canAfford}
      className={cn(
        'group relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 text-center transition-all duration-200',
        canAfford
          ? cn('hover:scale-[1.03] active:scale-[0.98] cursor-pointer', caseDef.borderColor)
          : 'border-zinc-800 opacity-50 cursor-not-allowed',
      )}
      style={{
        background: canAfford
          ? `linear-gradient(145deg, ${caseDef.accentFrom}60, ${caseDef.accentTo}80)`
          : undefined,
      }}
    >
      {canAfford && (
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
      )}

      <span className="text-6xl drop-shadow-lg leading-none">{caseDef.emoji}</span>

      <div>
        <p className="font-black text-white text-lg leading-tight">{caseDef.name}</p>
        <p className="text-xs text-zinc-400 mt-1">{caseDef.description}</p>
      </div>

      <div className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-xl border font-bold text-sm',
        canAfford
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          : 'bg-zinc-800/60 border-zinc-700 text-zinc-500',
      )}>
        <Coins className="w-4 h-4" />
        {caseDef.price.toLocaleString()} coinů
      </div>

      {!canAfford && (
        <p className="text-[11px] text-zinc-600">
          Chybí {(caseDef.price - coins).toLocaleString()} coinů
        </p>
      )}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function CasesPage() {
  const { data: profile, refetch } = useProfile();
  const [openCase, setOpenCase]   = useState<CaseDef | null>(null);

  const coins: number = (profile as any)?.coins ?? 0;

  return (
    <div className="max-w-3xl space-y-6">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">SM Bedny</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Otevři bednu a získej náhodný skin pro svou postavu</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex-shrink-0">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-lg font-black text-amber-400 tabular-nums">{coins.toLocaleString()}</span>
          <span className="text-xs text-zinc-500 hidden sm:block">SM coinů</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CASES.map((c) => (
          <BednaCard key={c.id} caseDef={c} coins={coins} onOpen={setOpenCase} />
        ))}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 text-xs text-zinc-500 space-y-1.5">
        <p className="font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" /> Jak to funguje
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span><span className="text-zinc-400 font-semibold">Common</span> — základní itemy</span>
          <span><span className="text-blue-400 font-semibold">Rare</span> — vzácnější kousky</span>
          <span><span className="text-purple-400 font-semibold">Epic</span> — prémiové itemy</span>
          <span><span className="text-amber-400 font-semibold">Legendary</span> — exkluzivní rarities</span>
        </div>
        <p className="pt-1">✦ Itemy jdou přímo do inventáře postavy</p>
      </div>

      {openCase && (
        <SpinModal
          caseDef={openCase}
          onClose={() => setOpenCase(null)}
          onCoinChange={() => void refetch()}
        />
      )}
    </div>
  );
}
