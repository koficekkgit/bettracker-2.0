import type { BetStatus, SurebetLeg } from './types';

export const SB_PREFIX = '__sb__';

export function serializeSurebetLegs(legs: SurebetLeg[]): string {
  return SB_PREFIX + JSON.stringify(legs);
}

export function parseSurebetLegs(notes: string | null | undefined): SurebetLeg[] | null {
  if (!notes?.startsWith(SB_PREFIX)) return null;
  try {
    return JSON.parse(notes.slice(SB_PREFIX.length));
  } catch {
    return null;
  }
}

export function computeSurebetStatus(legs: SurebetLeg[]): BetStatus {
  if (legs.some((l) => l.status === 'pending')) return 'pending';
  if (legs.some((l) => l.status === 'won')) return 'won';
  return 'lost';
}

/** Returns payout (sum of winning leg returns), or null if all pending. */
export function computeSurebetPayout(legs: SurebetLeg[]): number | null {
  if (legs.every((l) => l.status === 'pending')) return null;
  const payout = legs
    .filter((l) => l.status === 'won')
    .reduce((sum, l) => sum + l.stake * l.odds, 0);
  return payout;
}

export function defaultSurebetLegs(): SurebetLeg[] {
  return [
    { bookmaker: '', odds: 2.0, stake: 0, status: 'pending' },
    { bookmaker: '', odds: 2.0, stake: 0, status: 'pending' },
  ];
}
