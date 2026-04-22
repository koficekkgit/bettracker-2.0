export type ItemSlot = 'skin' | 'hair' | 'hair_color' | 'outfit' | 'accessory';

export interface ShopItem {
  id: string;
  slot: ItemSlot;
  label: string;
  price: number;     // 0 = free / default
  color?: string;    // CSS color for swatches
  preview?: string;  // optional label override in preview
}

// ─── SKINS ──────────────────────────────────────────────────
export const SKINS: ShopItem[] = [
  { id: 'skin_default', slot: 'skin', label: 'Přirozená', price: 0,    color: '#FDDBB4' },
  { id: 'skin_dark',    slot: 'skin', label: 'Tmavá',     price: 0,    color: '#8B5524' },
  { id: 'skin_light',   slot: 'skin', label: 'Světlá',    price: 0,    color: '#FDEBD0' },
  { id: 'skin_tan',     slot: 'skin', label: 'Opálená',   price: 0,    color: '#D4956A' },
  { id: 'skin_cool',    slot: 'skin', label: 'Ledová',    price: 500,  color: '#B3D9F2' },
  { id: 'skin_gold',    slot: 'skin', label: 'Zlatá',     price: 2000, color: '#FFD700' },
];

// ─── HAIR STYLES ────────────────────────────────────────────
export const HAIR_STYLES: ShopItem[] = [
  { id: 'hair_none',   slot: 'hair', label: 'Plešatý',   price: 0   },
  { id: 'hair_short',  slot: 'hair', label: 'Krátké',    price: 0   },
  { id: 'hair_bun',    slot: 'hair', label: 'Drdol',     price: 150 },
  { id: 'hair_long',   slot: 'hair', label: 'Dlouhé',    price: 200 },
  { id: 'hair_spiky',  slot: 'hair', label: 'Ostnaté',   price: 200 },
  { id: 'hair_curly',  slot: 'hair', label: 'Kudrnaté',  price: 300 },
  { id: 'hair_mohawk', slot: 'hair', label: 'Mohawk',    price: 500 },
];

// ─── HAIR COLORS ────────────────────────────────────────────
export const HAIR_COLORS: ShopItem[] = [
  { id: 'hc_black',  slot: 'hair_color', label: 'Černá',    price: 0,   color: '#1A1A2E' },
  { id: 'hc_brown',  slot: 'hair_color', label: 'Hnědá',    price: 0,   color: '#6B3A2A' },
  { id: 'hc_blonde', slot: 'hair_color', label: 'Blond',    price: 100, color: '#DAA520' },
  { id: 'hc_red',    slot: 'hair_color', label: 'Ryšavá',   price: 100, color: '#CC3300' },
  { id: 'hc_orange', slot: 'hair_color', label: 'Oranžová', price: 150, color: '#FF6600' },
  { id: 'hc_blue',   slot: 'hair_color', label: 'Modrá',    price: 200, color: '#1E90FF' },
  { id: 'hc_green',  slot: 'hair_color', label: 'Zelená',   price: 200, color: '#228B22' },
  { id: 'hc_purple', slot: 'hair_color', label: 'Fialová',  price: 200, color: '#8B008B' },
  { id: 'hc_pink',   slot: 'hair_color', label: 'Růžová',   price: 250, color: '#FF69B4' },
  { id: 'hc_white',  slot: 'hair_color', label: 'Bílá',     price: 300, color: '#E8E8E8' },
];

// ─── OUTFITS ────────────────────────────────────────────────
export const OUTFITS: ShopItem[] = [
  { id: 'outfit_basic',    slot: 'outfit', label: 'Základní',    price: 0,    color: '#4A5568' },
  { id: 'outfit_hoodie',   slot: 'outfit', label: 'Mikina',      price: 300,  color: '#2D3748' },
  { id: 'outfit_champion', slot: 'outfit', label: 'Dres',        price: 800,  color: '#C53030' },
  { id: 'outfit_cyber',    slot: 'outfit', label: 'Cyber',       price: 1000, color: '#00B5D8' },
  { id: 'outfit_suit',     slot: 'outfit', label: 'Oblek',       price: 600,  color: '#1A202C' },
  { id: 'outfit_winner',   slot: 'outfit', label: 'Zlatá bunda', price: 1200, color: '#B7791F' },
  { id: 'outfit_legend',   slot: 'outfit', label: 'Legend robe', price: 2500, color: '#553C9A' },
];

// ─── ACCESSORIES ────────────────────────────────────────────
export const ACCESSORIES: ShopItem[] = [
  { id: 'acc_none',       slot: 'accessory', label: 'Žádný',     price: 0    },
  { id: 'acc_glasses',    slot: 'accessory', label: 'Brýle',     price: 200  },
  { id: 'acc_cap',        slot: 'accessory', label: 'Kšiltovka', price: 300  },
  { id: 'acc_headphones', slot: 'accessory', label: 'Sluchátka', price: 400  },
  { id: 'acc_halo',       slot: 'accessory', label: 'Halo',      price: 800  },
  { id: 'acc_crown',      slot: 'accessory', label: 'Koruna',    price: 1500 },
  { id: 'acc_trophy',     slot: 'accessory', label: 'Trofej',    price: 2000 },
];

export const ALL_ITEMS: ShopItem[] = [
  ...SKINS,
  ...HAIR_STYLES,
  ...HAIR_COLORS,
  ...OUTFITS,
  ...ACCESSORIES,
];

export const FREE_ITEM_IDS = new Set(ALL_ITEMS.filter((i) => i.price === 0).map((i) => i.id));

export interface CharacterConfig {
  skin:       string;
  hair:       string;
  hair_color: string;
  outfit:     string;
  accessory:  string;
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  skin:       'skin_default',
  hair:       'hair_short',
  hair_color: 'hc_black',
  outfit:     'outfit_basic',
  accessory:  'acc_none',
};

// Resolve actual CSS color values for rendering
export const SKIN_COLOR_MAP: Record<string, string> = Object.fromEntries(
  SKINS.map((s) => [s.id, s.color!])
);
export const HAIR_COLOR_MAP: Record<string, string> = Object.fromEntries(
  HAIR_COLORS.map((h) => [h.id, h.color!])
);
export const OUTFIT_COLOR_MAP: Record<string, string> = Object.fromEntries(
  OUTFITS.map((o) => [o.id, o.color!])
);
