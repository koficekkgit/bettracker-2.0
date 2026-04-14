// Šablony populárních sázkovek pro rychlé vytvoření účtu
export type BookmakerTemplate = {
  key: string;
  name: string;
  country?: string;
};

export const BOOKMAKER_TEMPLATES: BookmakerTemplate[] = [
  { key: 'tipsport', name: 'Tipsport', country: 'cz' },
  { key: 'fortuna', name: 'Fortuna', country: 'cz' },
  { key: 'betano', name: 'Betano', country: 'cz' },
  { key: 'chance', name: 'Chance', country: 'cz' },
  { key: 'synot', name: 'Synot Tip', country: 'cz' },
  { key: 'kingsbet', name: 'Kingsbet', country: 'cz' },
  { key: 'ifortuna', name: 'iFortuna', country: 'cz' },
  { key: 'pinnacle', name: 'Pinnacle' },
  { key: 'bet365', name: 'Bet365' },
  { key: 'unibet', name: 'Unibet' },
  { key: 'betway', name: 'Betway' },
  { key: 'williamhill', name: 'William Hill' },
];

export type BookmakerAccount = {
  id: string;
  user_id: string;
  name: string;
  template_key: string | null;
  currency: string;
  hard_limit: boolean;
  low_balance_threshold: number | null;
  archived_at: string | null;
  sort_order: number;
  created_at: string;
};

export type BankrollTransaction = {
  id: string;
  account_id: string;
  kind: 'deposit' | 'withdrawal' | 'bonus' | 'adjustment' | 'bet_placed' | 'bet_settled';
  amount: number;
  bet_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type AccountBalance = {
  account_id: string;
  user_id: string;
  balance: number;
};

/**
 * Najde šablonu podle template_key (case-insensitive)
 */
export function findTemplate(key: string | null | undefined): BookmakerTemplate | undefined {
  if (!key) return undefined;
  return BOOKMAKER_TEMPLATES.find((t) => t.key === key.toLowerCase());
}

/**
 * Human-readable popis typu transakce pro i18n keys
 */
export function transactionKindKey(kind: BankrollTransaction['kind']): string {
  return `bankroll.txKind.${kind}`;
}
