import { ALL_ITEMS, type ShopItem } from './character';

export interface CasePoolItem {
  itemId: string;
  weight: number;
}

export interface CaseDef {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  items: CasePoolItem[];
}

export function rollCaseItem(caseDef: CaseDef): ShopItem {
  const total = caseDef.items.reduce((s, i) => s + i.weight, 0);
  let rand    = Math.random() * total;
  for (const ci of caseDef.items) {
    rand -= ci.weight;
    if (rand <= 0) {
      const found = ALL_ITEMS.find((i) => i.id === ci.itemId);
      if (found) return found;
    }
  }
  return ALL_ITEMS.find((i) => i.id === caseDef.items.at(-1)!.itemId)!;
}

export const CASES: CaseDef[] = [
  {
    id: 'starter',
    name: 'Starter Bedna',
    description: 'Common & rare itemy pro nováčky',
    price: 300,
    emoji: '📦',
    accentFrom: '#52525b',
    accentTo: '#27272a',
    borderColor: 'border-zinc-600',
    items: [
      { itemId: 'acc_glasses',     weight: 30 },
      { itemId: 'acc_cap',         weight: 28 },
      { itemId: 'hair_bun',        weight: 25 },
      { itemId: 'hc_blonde',       weight: 22 },
      { itemId: 'hc_orange',       weight: 20 },
      { itemId: 'hair_long',       weight: 15 },
      { itemId: 'hc_blue',         weight: 12 },
      { itemId: 'acc_chain',       weight: 10 },
      { itemId: 'acc_headphones',  weight: 8  },
      { itemId: 'outfit_tracksuit',weight: 5  },
      { itemId: 'hair_mohawk',     weight: 3  },
      { itemId: 'acc_rolex',       weight: 2  },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Bedna',
    description: 'Rare & epic kousky pro profíky',
    price: 700,
    emoji: '💼',
    accentFrom: '#1e3a5f',
    accentTo: '#3b0764',
    borderColor: 'border-blue-500/50',
    items: [
      { itemId: 'hair_fade',        weight: 20 },
      { itemId: 'hc_purple',        weight: 18 },
      { itemId: 'hc_pink',          weight: 16 },
      { itemId: 'acc_sunglasses',   weight: 16 },
      { itemId: 'outfit_suit',      weight: 14 },
      { itemId: 'outfit_supreme',   weight: 10 },
      { itemId: 'acc_supreme_cap',  weight: 8  },
      { itemId: 'hc_white',         weight: 6  },
      { itemId: 'acc_rolex',        weight: 5  },
      { itemId: 'acc_halo',         weight: 4  },
      { itemId: 'outfit_winner',    weight: 2  },
      { itemId: 'acc_crown',        weight: 1  },
    ],
  },
  {
    id: 'legend',
    name: 'Legend Bedna',
    description: 'Nejlepší legendary itemy v celé hře',
    price: 1500,
    emoji: '👑',
    accentFrom: '#78350f',
    accentTo: '#451a03',
    borderColor: 'border-amber-500/50',
    items: [
      { itemId: 'outfit_cyber',       weight: 18 },
      { itemId: 'outfit_streetwear',  weight: 16 },
      { itemId: 'acc_halo',           weight: 14 },
      { itemId: 'hc_galaxy',          weight: 12 },
      { itemId: 'outfit_winner',      weight: 10 },
      { itemId: 'skin_gold',          weight: 8  },
      { itemId: 'acc_crown',          weight: 6  },
      { itemId: 'outfit_legend',      weight: 4  },
      { itemId: 'acc_trophy',         weight: 3  },
      { itemId: 'acc_diamondchain',   weight: 2  },
      { itemId: 'outfit_balenciaga',  weight: 1  },
    ],
  },
];

// Build a strip of items for the spin animation.
// Winner is always placed at WINNER_IDX.
export const WINNER_IDX = 44;

export function buildStrip(caseDef: CaseDef, winner: ShopItem): ShopItem[] {
  const strip: ShopItem[] = [];
  for (let i = 0; i < WINNER_IDX; i++) {
    strip.push(rollCaseItem(caseDef));
  }
  strip.push(winner);
  for (let i = 0; i < 11; i++) {
    strip.push(rollCaseItem(caseDef));
  }
  return strip;
}
