/**
 * SPAYD (Short Payment Descriptor) - český standard pro QR platby
 * Specifikace: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 *
 * Formát: SPD*1.0*ACC:CZxxxx*AM:1234*CC:CZK*X-VS:42*MSG:Text
 */

export interface SpaydParams {
  iban: string;          // ve formátu CZxxxxxxxxxxxxxxxxxxxxxx (bez mezer)
  amount: number;        // v Kč (může mít 2 desetinná místa)
  currency?: string;     // default CZK
  variableSymbol?: number;
  message?: string;      // max 60 znaků, bez diakritiky
}

/**
 * Vygeneruje SPAYD řetězec, který se dá vložit do QR kódu.
 */
export function generateSpayd(params: SpaydParams): string {
  const parts: string[] = ['SPD*1.0'];

  // ACC (povinné)
  parts.push(`ACC:${params.iban.replace(/\s/g, '').toUpperCase()}`);

  // AM - částka
  parts.push(`AM:${params.amount.toFixed(2)}`);

  // CC - měna
  parts.push(`CC:${params.currency ?? 'CZK'}`);

  // X-VS - variabilní symbol
  if (params.variableSymbol !== undefined) {
    parts.push(`X-VS:${params.variableSymbol}`);
  }

  // MSG - zpráva pro příjemce (max 60 znaků, bez diakritiky)
  if (params.message) {
    const msg = removeDiacritics(params.message).slice(0, 60);
    parts.push(`MSG:${msg}`);
  }

  return parts.join('*');
}

function removeDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Validuje IBAN pro CZ - jen základní formát kontrola
 */
export function isValidCzIban(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return /^CZ\d{22}$/.test(clean);
}

/**
 * Plány a jejich ceny - jediný zdroj pravdy pro celý projekt
 */
export const SUBSCRIPTION_PLANS = {
  monthly: { name: 'Měsíční', price: 99, days: 30 },
  quarterly: { name: 'Čtvrtletní', price: 249, days: 90 },
  yearly: { name: 'Roční', price: 699, days: 365 },
  lifetime: { name: 'Lifetime', price: 1199, days: null },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
