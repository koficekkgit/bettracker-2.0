import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { calculateStats, calculateBetProfit } from '@/lib/stats';
import { BOOKMAKERS } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  // 1. Ověř autentikaci
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Ověř, že máme API klíč
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  // 3. Načti sázky (posledních 90 dní) a kategorie
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const fromDate = ninetyDaysAgo.toISOString().slice(0, 10);

  const [{ data: bets }, { data: categories }] = await Promise.all([
    supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .gte('placed_at', fromDate)
      .order('placed_at', { ascending: false }),
    supabase.from('categories').select('*').eq('user_id', user.id),
  ]);

  if (!bets || bets.length === 0) {
    return NextResponse.json({ error: 'no_data' }, { status: 400 });
  }

  const settledBets = bets.filter((b) => b.status !== 'pending');
  if (settledBets.length < 10) {
    return NextResponse.json({ error: 'not_enough_data' }, { status: 400 });
  }

  // 4. Připrav agregovaná data - NEPOSÍLÁME surová data do LLM, jen agregace
  const stats = calculateStats(bets);
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  // Rozpad podle kategorie
  const byCategory = new Map<string, { profit: number; count: number; won: number }>();
  for (const bet of bets) {
    const name = categoryMap.get(bet.category_id ?? '') ?? 'Nezařazeno';
    const cur = byCategory.get(name) ?? { profit: 0, count: 0, won: 0 };
    cur.profit += calculateBetProfit(bet);
    cur.count++;
    if (bet.status === 'won') cur.won++;
    byCategory.set(name, cur);
  }

  // Rozpad podle bookmakera
  const byBookmaker = new Map<string, { profit: number; count: number }>();
  for (const bet of bets) {
    const name = BOOKMAKERS.find((b) => b.id === bet.bookmaker)?.name ?? 'Neznámý';
    const cur = byBookmaker.get(name) ?? { profit: 0, count: 0 };
    cur.profit += calculateBetProfit(bet);
    cur.count++;
    byBookmaker.set(name, cur);
  }

  // Rozpad podle rozsahu kurzů
  const oddsBuckets = { low: 0, mid: 0, high: 0, veryHigh: 0 };
  const oddsProfits = { low: 0, mid: 0, high: 0, veryHigh: 0 };
  for (const bet of bets) {
    const o = Number(bet.odds);
    const p = calculateBetProfit(bet);
    if (o < 1.5) { oddsBuckets.low++; oddsProfits.low += p; }
    else if (o < 2.0) { oddsBuckets.mid++; oddsProfits.mid += p; }
    else if (o < 3.0) { oddsBuckets.high++; oddsProfits.high += p; }
    else { oddsBuckets.veryHigh++; oddsProfits.veryHigh += p; }
  }

  // Rozpad podle dne v týdnu
  const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  const byWeekday = new Map<string, { profit: number; count: number }>();
  for (const bet of bets) {
    const day = weekdays[new Date(bet.placed_at).getDay()];
    const cur = byWeekday.get(day) ?? { profit: 0, count: 0 };
    cur.profit += calculateBetProfit(bet);
    cur.count++;
    byWeekday.set(day, cur);
  }

  const currency = bets[0]?.currency ?? 'CZK';

  // 5. Sestav data pro Claude
  const summary = {
    period_days: 90,
    total_bets: stats.totalBets,
    settled_bets: stats.settledBets,
    won_bets: stats.wonBets,
    lost_bets: stats.lostBets,
    total_staked: Math.round(stats.totalStaked),
    total_profit: Math.round(stats.totalProfit),
    roi_percent: Math.round(stats.roi * 10) / 10,
    win_rate_percent: Math.round(stats.winRate),
    avg_odds: Math.round(stats.avgOdds * 100) / 100,
    longest_win_streak: stats.longestWinStreak,
    longest_loss_streak: stats.longestLossStreak,
    best_win: Math.round(stats.bestWin),
    worst_loss: Math.round(stats.worstLoss),
    currency,
    by_category: Array.from(byCategory.entries()).map(([name, d]) => ({
      name,
      count: d.count,
      profit: Math.round(d.profit),
      win_rate: d.count > 0 ? Math.round((d.won / d.count) * 100) : 0,
    })),
    by_bookmaker: Array.from(byBookmaker.entries()).map(([name, d]) => ({
      name,
      count: d.count,
      profit: Math.round(d.profit),
    })),
    by_odds_range: [
      { range: '1.01-1.49', count: oddsBuckets.low, profit: Math.round(oddsProfits.low) },
      { range: '1.50-1.99', count: oddsBuckets.mid, profit: Math.round(oddsProfits.mid) },
      { range: '2.00-2.99', count: oddsBuckets.high, profit: Math.round(oddsProfits.high) },
      { range: '3.00+', count: oddsBuckets.veryHigh, profit: Math.round(oddsProfits.veryHigh) },
    ],
    by_weekday: Array.from(byWeekday.entries()).map(([day, d]) => ({
      day,
      count: d.count,
      profit: Math.round(d.profit),
    })),
  };

  // 6. Zavolej Claude API
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Jsi zkušený analytik sportovních sázek. Dostaneš agregované statistiky hráče za posledních 90 dní a máš mu dát konkrétní, užitečnou zpětnou vazbu v češtině.

DATA HRÁČE:
${JSON.stringify(summary, null, 2)}

POŽADAVKY NA TVOJI ODPOVĚĎ:
1. Napiš analýzu v Markdown formátu (použij ## nadpisy, **tučné**, seznamy)
2. Buď konkrétní - cituj reálná čísla z dat
3. Struktura:
   - ## Celkové hodnocení (2-3 věty o aktuálním stavu)
   - ## Co ti funguje (kategorie/typy sázek kde vyděláváš)
   - ## Co ti nejde (kde tratíš peníze, konkrétně)
   - ## 3 konkrétní doporučení (očíslovaná, akční)
4. Buď přátelský ale upřímný - pokud je hráč ve ztrátě, neomlouvej to
5. NEPOSKYTUJ finanční poradenství, piš to jako zamyšlení nad daty
6. Krátké, cca 300-400 slov celkem
7. Nezmiňuj, že jsi Claude nebo AI - piš jako osobní trenér

Začni rovnou markdownem, bez úvodního pozdravu.`,
        },
      ],
    });

    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      analysis: text,
      stats: summary,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Anthropic API error:', err);
    return NextResponse.json({ error: 'api_error' }, { status: 500 });
  }
}
