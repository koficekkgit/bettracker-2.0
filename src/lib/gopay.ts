/**
 * GoPay API klient
 *
 * Dokumentace: https://doc.gopay.com/
 * Sandbox:     https://gw.sandbox.gopay.cz/api/
 * Produkce:    https://gate.gopay.cz/api/
 *
 * Potřebné env proměnné (přidat do .env.local i Vercel):
 *   GOPAY_CLIENT_ID       – z GoPay merchant administrace
 *   GOPAY_CLIENT_SECRET   – z GoPay merchant administrace
 *   GOPAY_GO_ID           – numerické GoID (identifikace obchodníka)
 *   GOPAY_SANDBOX         – "true" pro testování, jinak produkce
 */

const BASE_URL = process.env.GOPAY_SANDBOX === 'true'
  ? 'https://gw.sandbox.gopay.cz/api'
  : 'https://gate.gopay.cz/api';

// ─── Typy ────────────────────────────────────────────────────────────────────

export type GoPayCurrency = 'CZK';
export type GoPayLang = 'CS' | 'EN';

export interface GoPayItem {
  type: 'ITEM';
  name: string;
  amount: number;   // v haléřích (Kč × 100)
  count: number;
  vat_rate: 0 | 10 | 15 | 21;
}

export type RecurrenceCycle = 'DAY' | 'WEEK' | 'MONTH';

export interface Recurrence {
  /** Typ opakování */
  recurrence_cycle: RecurrenceCycle;
  /** Každých N cyklů (1 = každý měsíc, 3 = každé 3 měsíce atd.) */
  recurrence_period: number;
  /** Datum konce opakování (YYYY-MM-DD), null = neomezeno */
  recurrence_date_to?: string;
}

export interface CreatePaymentParams {
  /** Unikátní číslo objednávky (VS nebo jiný identifikátor) */
  order_number: string;
  /** Popis objednávky */
  order_description: string;
  /** Částka v haléřích (Kč × 100), např. 9900 = 99 Kč */
  amount: number;
  currency: GoPayCurrency;
  /** Email zákazníka */
  buyer_email: string;
  /** Jméno zákazníka (volitelné) */
  buyer_name?: string;
  /** URL kam GoPay přesměruje po platbě */
  return_url: string;
  /** URL kam GoPay pošle notifikaci (webhook) */
  notify_url: string;
  /** Položky na platbě */
  items: GoPayItem[];
  lang?: GoPayLang;
  /** Nastavení opakované platby (pro měsíční/čtvrtletní/roční předplatné) */
  recurrence?: Recurrence;
}

export interface GoPayPayment {
  id: number;
  order_number: string;
  state: 'CREATED' | 'PAYMENT_METHOD_CHOSEN' | 'PAID' | 'AUTHORIZED' | 'CANCELED' | 'TIMEOUTED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  amount: number;
  currency: string;
  payer: {
    contact: {
      email: string;
    };
  };
  /** URL na GoPay platební bránu — uživatele tam přesměrujeme */
  gw_url: string;
  instrument?: string;
}

// ─── Token cache (in-memory, platí max 30 min) ───────────────────────────────

let _token: string | null = null;
let _tokenExpires = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_token && now < _tokenExpires) return _token;

  const clientId     = process.env.GOPAY_CLIENT_ID!;
  const clientSecret = process.env.GOPAY_CLIENT_SECRET!;
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials&scope=payment-create',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GoPay auth failed: ${err}`);
  }

  const data = await res.json();
  _token = data.access_token as string;
  // expires_in je v sekundách, odečteme 60s buffer
  _tokenExpires = now + (data.expires_in - 60) * 1000;
  return _token;
}

// ─── Vytvoření platby ─────────────────────────────────────────────────────────

export async function createPayment(params: CreatePaymentParams): Promise<GoPayPayment> {
  const token = await getAccessToken();
  const goId  = process.env.GOPAY_GO_ID!;

  const body = {
    payer: {
      contact: {
        email: params.buyer_email,
        ...(params.buyer_name ? { first_name: params.buyer_name } : {}),
      },
    },
    target: {
      type: 'ACCOUNT',
      go_id: Number(goId),
    },
    amount: params.amount,
    currency: params.currency,
    order_number: params.order_number,
    order_description: params.order_description,
    items: params.items,
    callback: {
      return_url: params.return_url,
      notification_url: params.notify_url,
    },
    lang: params.lang ?? 'CS',
    ...(params.recurrence ? { recurrence: params.recurrence } : {}),
  };

  const res = await fetch(`${BASE_URL}/payments/payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GoPay createPayment failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<GoPayPayment>;
}

// ─── Stav platby ─────────────────────────────────────────────────────────────

export async function getPayment(paymentId: number): Promise<GoPayPayment> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/payments/payment/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GoPay getPayment failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<GoPayPayment>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Převede Kč na haléře (GoPay pracuje v haléřích) */
export function kczToHalere(kc: number): number {
  return Math.round(kc * 100);
}
