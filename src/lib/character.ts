export type ItemSlot = 'skin' | 'hair' | 'hair_color' | 'outfit' | 'accessory';

export interface ShopItem {
  id: string;
  slot: ItemSlot;
  label: string;
  sublabel?: string;       // e.g. brand/flavour
  price: number;
  color?: string;          // swatch color
  emoji?: string;          // icon for non-color items
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

// ─── SKINS ──────────────────────────────────────────────────
export const SKINS: ShopItem[] = [
  { id: 'skin_default', slot: 'skin', label: 'Přirozená',  price: 0,    color: '#FDDBB4', rarity: 'common'    },
  { id: 'skin_dark',    slot: 'skin', label: 'Tmavá',      price: 0,    color: '#8B5524', rarity: 'common'    },
  { id: 'skin_light',   slot: 'skin', label: 'Světlá',     price: 0,    color: '#FDEBD0', rarity: 'common'    },
  { id: 'skin_tan',     slot: 'skin', label: 'Opálená',    price: 0,    color: '#D4956A', rarity: 'common'    },
  { id: 'skin_cool',    slot: 'skin', label: 'Ledová',     price: 500,  color: '#B3D9F2', rarity: 'rare'      },
  { id: 'skin_gold',    slot: 'skin', label: 'Zlatá',      price: 2000, color: '#FFD700', rarity: 'legendary' },
];

// ─── HAIR STYLES ────────────────────────────────────────────
export const HAIR_STYLES: ShopItem[] = [
  { id: 'hair_none',   slot: 'hair', label: 'Plešatý',  emoji: '○',  price: 0,   rarity: 'common' },
  { id: 'hair_short',  slot: 'hair', label: 'Krátké',   emoji: '◠',  price: 0,   rarity: 'common' },
  { id: 'hair_bun',    slot: 'hair', label: 'Drdol',    emoji: '●',  price: 150, rarity: 'common' },
  { id: 'hair_long',   slot: 'hair', label: 'Dlouhé',   emoji: '〜', price: 200, rarity: 'rare'   },
  { id: 'hair_spiky',  slot: 'hair', label: 'Ostnaté',  emoji: '⚡',  price: 200, rarity: 'rare'   },
  { id: 'hair_fade',   slot: 'hair', label: 'Fade',     emoji: '💈', price: 350, rarity: 'rare'   },
  { id: 'hair_curly',  slot: 'hair', label: 'Kudrnaté', emoji: '🌀', price: 300, rarity: 'rare'   },
  { id: 'hair_mohawk', slot: 'hair', label: 'Mohawk',   emoji: '🦔', price: 500, rarity: 'epic'   },
];

// ─── HAIR COLORS ────────────────────────────────────────────
export const HAIR_COLORS: ShopItem[] = [
  { id: 'hc_black',  slot: 'hair_color', label: 'Černá',    price: 0,   color: '#1A1A2E', rarity: 'common' },
  { id: 'hc_brown',  slot: 'hair_color', label: 'Hnědá',    price: 0,   color: '#6B3A2A', rarity: 'common' },
  { id: 'hc_blonde', slot: 'hair_color', label: 'Blond',    price: 100, color: '#DAA520', rarity: 'common' },
  { id: 'hc_red',    slot: 'hair_color', label: 'Ryšavá',   price: 100, color: '#CC3300', rarity: 'common' },
  { id: 'hc_orange', slot: 'hair_color', label: 'Oranžová', price: 150, color: '#FF6600', rarity: 'common' },
  { id: 'hc_blue',   slot: 'hair_color', label: 'Modrá',    price: 200, color: '#1E90FF', rarity: 'rare'   },
  { id: 'hc_green',  slot: 'hair_color', label: 'Zelená',   price: 200, color: '#228B22', rarity: 'rare'   },
  { id: 'hc_purple', slot: 'hair_color', label: 'Fialová',  price: 200, color: '#8B008B', rarity: 'rare'   },
  { id: 'hc_pink',   slot: 'hair_color', label: 'Růžová',   price: 250, color: '#FF69B4', rarity: 'rare'   },
  { id: 'hc_white',  slot: 'hair_color', label: 'Bílá',     price: 300, color: '#E8E8E8', rarity: 'epic'   },
  { id: 'hc_galaxy', slot: 'hair_color', label: 'Galaxy',   price: 600, color: '#6B48FF', rarity: 'legendary' },
];

// ─── OUTFITS ────────────────────────────────────────────────
export const OUTFITS: ShopItem[] = [
  { id: 'outfit_basic',      slot: 'outfit', label: 'Základní',       price: 0,    color: '#4A5568', rarity: 'common',    emoji: '👕' },
  { id: 'outfit_hoodie',     slot: 'outfit', label: 'Mikina',         price: 300,  color: '#2D3748', rarity: 'common',    emoji: '🧥' },
  { id: 'outfit_tracksuit',  slot: 'outfit', label: 'Tracksuit',      price: 700,  color: '#1a3a1a', rarity: 'rare',      emoji: '🏃' },
  { id: 'outfit_suit',       slot: 'outfit', label: 'Oblek',          price: 600,  color: '#1A202C', rarity: 'rare',      emoji: '🤵' },
  { id: 'outfit_champion',   slot: 'outfit', label: 'Dres',           price: 800,  color: '#C53030', rarity: 'rare',      emoji: '⚽' },
  { id: 'outfit_supreme',    slot: 'outfit', label: 'Supreme',        price: 1200, color: '#CC0000', rarity: 'epic',      emoji: '🔴', sublabel: 'Drip' },
  { id: 'outfit_cyber',      slot: 'outfit', label: 'Cyber',          price: 1000, color: '#00B5D8', rarity: 'epic',      emoji: '🤖' },
  { id: 'outfit_streetwear', slot: 'outfit', label: 'Streetwear',     price: 900,  color: '#2D1B69', rarity: 'epic',      emoji: '🛹', sublabel: 'Drip' },
  { id: 'outfit_winner',     slot: 'outfit', label: 'Zlatá bunda',    price: 1500, color: '#B7791F', rarity: 'legendary', emoji: '🏆' },
  { id: 'outfit_legend',     slot: 'outfit', label: 'Legend Robe',    price: 2500, color: '#553C9A', rarity: 'legendary', emoji: '🧙', sublabel: 'Rare' },
  { id: 'outfit_balenciaga', slot: 'outfit', label: 'Balenciaga',     price: 3000, color: '#111111', rarity: 'legendary', emoji: '💎', sublabel: 'Drip' },
];

// ─── ACCESSORIES ────────────────────────────────────────────
export const ACCESSORIES: ShopItem[] = [
  { id: 'acc_none',        slot: 'accessory', label: 'Žádný',        price: 0,    emoji: '—',  rarity: 'common'    },
  { id: 'acc_glasses',     slot: 'accessory', label: 'Brýle',        price: 200,  emoji: '👓', rarity: 'common'    },
  { id: 'acc_cap',         slot: 'accessory', label: 'Kšiltovka',    price: 300,  emoji: '🧢', rarity: 'common'    },
  { id: 'acc_headphones',  slot: 'accessory', label: 'Sluchátka',    price: 400,  emoji: '🎧', rarity: 'rare'      },
  { id: 'acc_chain',       slot: 'accessory', label: 'Gold Chain',   price: 300,  emoji: '⛓️', rarity: 'rare',    sublabel: 'Drip' },
  { id: 'acc_sunglasses',  slot: 'accessory', label: 'Ray-Ban',      price: 350,  emoji: '🕶️', rarity: 'rare',   sublabel: 'Drip' },
  { id: 'acc_supreme_cap', slot: 'accessory', label: 'Supreme Cap',  price: 600,  emoji: '🔴', rarity: 'epic',     sublabel: 'Drip' },
  { id: 'acc_rolex',       slot: 'accessory', label: 'Rolex',        price: 800,  emoji: '⌚', rarity: 'epic',     sublabel: 'Drip' },
  { id: 'acc_halo',        slot: 'accessory', label: 'Halo',         price: 800,  emoji: '✨', rarity: 'epic'      },
  { id: 'acc_crown',       slot: 'accessory', label: 'Koruna',       price: 1500, emoji: '👑', rarity: 'legendary' },
  { id: 'acc_trophy',      slot: 'accessory', label: 'Trofej',       price: 2000, emoji: '🏆', rarity: 'legendary' },
  { id: 'acc_diamondchain',slot: 'accessory', label: 'Diamond Chain',price: 2500, emoji: '💎', rarity: 'legendary', sublabel: 'Drip' },
];

export const ALL_ITEMS: ShopItem[] = [
  ...SKINS, ...HAIR_STYLES, ...HAIR_COLORS, ...OUTFITS, ...ACCESSORIES,
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

export const SKIN_COLOR_MAP: Record<string, string> = Object.fromEntries(
  SKINS.map((s) => [s.id, s.color!])
);
export const HAIR_COLOR_MAP: Record<string, string> = Object.fromEntries(
  HAIR_COLORS.map((h) => [h.id, h.color!])
);
export const OUTFIT_COLOR_MAP: Record<string, string> = Object.fromEntries(
  OUTFITS.map((o) => [o.id, o.color!])
);

export const RARITY_CFG = {
  common:    { label: 'Common',    color: 'text-zinc-400',   dot: 'bg-zinc-500',   glow: ''                              },
  rare:      { label: 'Rare',      color: 'text-blue-400',   dot: 'bg-blue-500',   glow: '0 0 12px rgba(96,165,250,0.4)' },
  epic:      { label: 'Epic',      color: 'text-purple-400', dot: 'bg-purple-500', glow: '0 0 14px rgba(168,85,247,0.4)' },
  legendary: { label: 'Legendary', color: 'text-amber-400',  dot: 'bg-amber-500',  glow: '0 0 18px rgba(251,191,36,0.5)' },
} as const;
