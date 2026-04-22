'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Coins, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { useBets } from '@/hooks/use-bets';
import { cn } from '@/lib/utils';
import {
  DAILY_TASKS, WEEKLY_TASKS,
  getDailyKey, getWeeklyKey,
  getNextDailyReset, getNextWeeklyReset,
  type TaskDef,
} from '@/lib/tasks';

// ── Countdown hook ───────────────────────────────────────────

function useCountdown(target: Date): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function update() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setLabel('brzy'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    }
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [target]);

  return label;
}

// ── Task card ────────────────────────────────────────────────

function TaskCard({
  task,
  progress,
  claimed,
  onClaim,
  claiming,
}: {
  task: TaskDef;
  progress: number;
  claimed: boolean;
  onClaim: (task: TaskDef) => void;
  claiming: boolean;
}) {
  const done = progress >= task.target;
  const pct  = Math.min(100, Math.round((progress / task.target) * 100));

  return (
    <div className={cn(
      'relative flex flex-col gap-3 p-4 rounded-2xl border transition-all',
      claimed
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : done
        ? 'border-amber-500/40 bg-amber-500/5'
        : 'border-zinc-800 bg-zinc-900',
    )}>

      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
          claimed ? 'bg-emerald-500/15' : done ? 'bg-amber-500/10' : 'bg-zinc-800',
        )}>
          {claimed ? '✅' : task.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-bold text-sm leading-tight',
            claimed ? 'text-emerald-400' : done ? 'text-amber-300' : 'text-zinc-100',
          )}>
            {task.name}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{task.description}</p>
        </div>

        {/* Coin reward */}
        <div className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded-lg border flex-shrink-0',
          claimed
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : done
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-zinc-800/60 border-zinc-700',
        )}>
          <Coins className={cn('w-3 h-3', claimed || done ? 'text-amber-400' : 'text-zinc-500')} />
          <span className={cn('text-xs font-bold tabular-nums', claimed || done ? 'text-amber-400' : 'text-zinc-500')}>
            +{task.coins}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!claimed && (
        <div className="space-y-1">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                done ? 'bg-amber-400' : 'bg-violet-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-600 tabular-nums">
            {progress} / {task.target}
          </p>
        </div>
      )}

      {/* Claim button */}
      {!claimed && done && (
        <button
          onClick={() => onClaim(task)}
          disabled={claiming}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {claiming ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Coins className="w-4 h-4" />
              Získat {task.coins} coinů
            </>
          )}
        </button>
      )}

      {claimed && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Odměna získána
        </div>
      )}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────

function SectionHeader({ label, resetIn }: { label: string; resetIn: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-black tracking-tight">{label}</h2>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Clock className="w-3 h-3" />
        <span>Reset za <span className="text-zinc-400 tabular-nums">{resetIn}</span></span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function TasksPage() {
  const { data: profile } = useProfile();
  const { data: bets = [] } = useBets();
  const queryClient = useQueryClient();

  const [claimedKeys, setClaimedKeys] = useState<Set<string>>(new Set());
  const [claiming, setClaiming]       = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  const dailyKey  = getDailyKey();
  const weeklyKey = getWeeklyKey();

  const dailyReset  = useCountdown(getNextDailyReset());
  const weeklyReset = useCountdown(getNextWeeklyReset());

  const coins: number = (profile as any)?.coins ?? 0;

  // Load already-claimed tasks for current periods
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from('claimed_tasks')
        .select('task_id, period_key')
        .in('period_key', [dailyKey, weeklyKey]);
      if (data) {
        setClaimedKeys(new Set(data.map((r: any) => `${r.task_id}::${r.period_key}`)));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const handleClaim = useCallback(async (task: TaskDef) => {
    const periodKey = task.period === 'daily' ? dailyKey : weeklyKey;
    const ck        = `${task.id}::${periodKey}`;
    if (claimedKeys.has(ck)) return;

    setClaiming(task.id);
    const supabase = createClient();
    const { data: ok } = await supabase.rpc('claim_task', {
      p_task_id:    task.id,
      p_period_key: periodKey,
      p_coins:      task.coins,
    });
    setClaiming(null);

    if (!ok) { showToast('Úkol se nepodařilo vyzvednout'); return; }
    setClaimedKeys((prev) => new Set([...prev, ck]));
    showToast(`✦ +${task.coins} coinů získáno!`);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [claimedKeys, dailyKey, weeklyKey, queryClient]);

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Denní úkoly</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Plň úkoly a získávej SM coiny</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex-shrink-0">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-lg font-black text-amber-400 tabular-nums">{coins.toLocaleString()}</span>
          <span className="text-xs text-zinc-500 hidden sm:block">SM coinů</span>
        </div>
      </div>

      {/* Daily tasks */}
      <div>
        <SectionHeader label="📅 Denní" resetIn={dailyReset} />
        <div className="grid gap-3 sm:grid-cols-2">
          {DAILY_TASKS.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              progress={task.getProgress(bets, dailyKey)}
              claimed={claimedKeys.has(`${task.id}::${dailyKey}`)}
              onClaim={handleClaim}
              claiming={claiming === task.id}
            />
          ))}
        </div>
      </div>

      {/* Weekly tasks */}
      <div>
        <SectionHeader label="📆 Týdenní" resetIn={weeklyReset} />
        <div className="grid gap-3 sm:grid-cols-2">
          {WEEKLY_TASKS.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              progress={task.getProgress(bets, weeklyKey)}
              claimed={claimedKeys.has(`${task.id}::${weeklyKey}`)}
              onClaim={handleClaim}
              claiming={claiming === task.id}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 text-xs text-zinc-500 space-y-1">
        <p className="font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Jak to funguje
        </p>
        <p>✦ Denní úkoly se resetují každý den o půlnoci</p>
        <p>✦ Týdenní úkoly se resetují každé pondělí</p>
        <p>✦ Coiny použij v obchodě na nové itemy pro postavu</p>
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
