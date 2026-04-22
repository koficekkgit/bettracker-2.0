'use client';

import {
  CharacterConfig,
  SKIN_COLOR_MAP,
  HAIR_COLOR_MAP,
  OUTFIT_COLOR_MAP,
  DEFAULT_CHARACTER,
} from '@/lib/character';

interface Props {
  config?: Partial<CharacterConfig>;
  size?: number;
}

export function CharacterAvatar({ config: c = {}, size = 160 }: Props) {
  const cfg: CharacterConfig = { ...DEFAULT_CHARACTER, ...c };

  const skin   = SKIN_COLOR_MAP[cfg.skin]       ?? '#FDDBB4';
  const hair   = HAIR_COLOR_MAP[cfg.hair_color] ?? '#1A1A2E';
  const outfit = OUTFIT_COLOR_MAP[cfg.outfit]   ?? '#4A5568';
  const isGalaxyHair = cfg.hair_color === 'hc_galaxy';

  const sleeve = ['outfit_basic', 'outfit_suit'].includes(cfg.outfit) ? skin : outfit;
  const pants  = cfg.outfit === 'outfit_tracksuit' ? outfit : '#2D3748';

  return (
    <svg viewBox="0 0 120 180" width={size} height={size * 1.5} style={{ display: 'block', overflow: 'visible' }}>
      {/* Galaxy hair defs */}
      {isGalaxyHair && (
        <defs>
          <linearGradient id="galaxyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#6B48FF" />
            <stop offset="50%"  stopColor="#FF48C4" />
            <stop offset="100%" stopColor="#48C4FF" />
          </linearGradient>
        </defs>
      )}

      {/* Shadow */}
      <ellipse cx="60" cy="178" rx="30" ry="4" fill="rgba(0,0,0,0.18)" />

      {/* ── LEGS ── */}
      <rect x="33" y="138" width="22" height="38" rx="10" fill={pants} />
      <rect x="65" y="138" width="22" height="38" rx="10" fill={pants} />
      {/* Tracksuit stripe */}
      {cfg.outfit === 'outfit_tracksuit' && (
        <>
          <rect x="37" y="138" width="4" height="38" rx="2" fill="rgba(255,255,255,0.15)" />
          <rect x="69" y="138" width="4" height="38" rx="2" fill="rgba(255,255,255,0.15)" />
        </>
      )}
      {/* Shoes */}
      <ellipse cx="44" cy="174" rx="15" ry="6.5" fill="#111827" />
      <ellipse cx="76" cy="174" rx="15" ry="6.5" fill="#111827" />
      <ellipse cx="44" cy="172" rx="10"  ry="3.5" fill="#1F2937" />
      <ellipse cx="76" cy="172" rx="10"  ry="3.5" fill="#1F2937" />
      {/* Supreme / streetwear: white sneakers */}
      {(cfg.outfit === 'outfit_supreme' || cfg.outfit === 'outfit_streetwear' || cfg.outfit === 'outfit_balenciaga') && (
        <>
          <ellipse cx="44" cy="174" rx="15" ry="6.5" fill="#E8E8E8" />
          <ellipse cx="76" cy="174" rx="15" ry="6.5" fill="#E8E8E8" />
          <ellipse cx="44" cy="172" rx="10" ry="3.5" fill="#D0D0D0" />
          <ellipse cx="76" cy="172" rx="10" ry="3.5" fill="#D0D0D0" />
        </>
      )}

      {/* ── BODY ── */}
      <rect x="24" y="84" width="72" height="58" rx="14" fill={outfit} />

      {/* Outfit details */}
      {cfg.outfit === 'outfit_suit' && (
        <>
          <rect x="50" y="84" width="20" height="32" rx="3" fill="#F9FAFB" />
          <path d="M56 88 L64 88 L66 110 L60 115 L54 110 Z" fill="#DC2626" />
          {/* Lapels */}
          <path d="M50 88 L44 100 L50 96" fill="#1A202C" />
          <path d="M70 88 L76 100 L70 96" fill="#1A202C" />
        </>
      )}
      {cfg.outfit === 'outfit_supreme' && (
        <>
          {/* Supreme box logo */}
          <rect x="42" y="98" width="36" height="16" rx="2" fill="white" />
          <text x="60" y="110" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#CC0000" fontFamily="Arial">SUPREME</text>
          {/* Hood strings */}
          <line x1="52" y1="84" x2="50" y2="96" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <line x1="68" y1="84" x2="70" y2="96" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        </>
      )}
      {cfg.outfit === 'outfit_streetwear' && (
        <>
          <path d="M24 100 Q60 92 96 100" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
          <path d="M24 114 Q60 106 96 114" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
          <rect x="44" y="100" width="32" height="14" rx="2" fill="rgba(255,255,255,0.07)" />
        </>
      )}
      {cfg.outfit === 'outfit_balenciaga' && (
        <>
          <text x="60" y="108" textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.5)" fontFamily="Arial" letterSpacing="1">BALENCIAGA</text>
          {/* Minimalist collar */}
          <line x1="44" y1="88" x2="76" y2="88" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </>
      )}
      {cfg.outfit === 'outfit_cyber' && (
        <>
          <rect x="28" y="92" width="6" height="6" rx="1" fill="rgba(0,255,255,0.5)" />
          <rect x="86" y="92" width="6" height="6" rx="1" fill="rgba(0,255,255,0.5)" />
          <path d="M34 95 L86 95" stroke="rgba(0,255,255,0.3)" strokeWidth="1" fill="none" />
        </>
      )}
      {cfg.outfit === 'outfit_winner' && (
        <path d="M24 96 L60 90 L96 96" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
      )}
      {cfg.outfit === 'outfit_tracksuit' && (
        <>
          <rect x="27" y="88" width="4" height="54" rx="2" fill="rgba(255,255,255,0.12)" />
          <rect x="89" y="88" width="4" height="54" rx="2" fill="rgba(255,255,255,0.12)" />
          <path d="M31 84 Q60 80 89 84" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
        </>
      )}
      {cfg.outfit === 'outfit_legend' && (
        <>
          <path d="M24 100 Q60 92 96 100" stroke="#9F7AEA" strokeWidth="1.5" fill="none" />
          <path d="M24 112 Q60 104 96 112" stroke="#9F7AEA" strokeWidth="1.5" fill="none" />
          <circle cx="60" cy="92" r="5" fill="#9F7AEA" opacity="0.6" />
        </>
      )}

      {/* ── ARMS ── */}
      <rect x="6"  y="88" width="20" height="44" rx="10" fill={sleeve} />
      <rect x="94" y="88" width="20" height="44" rx="10" fill={sleeve} />

      {/* ── HANDS ── */}
      <circle cx="16"  cy="133" r="11" fill={skin} />
      <circle cx="104" cy="133" r="11" fill={skin} />

      {/* Rolex on left wrist */}
      {cfg.accessory === 'acc_rolex' && (
        <g>
          <rect x="7" y="118" width="18" height="12" rx="4" fill="#8B7355" />
          <rect x="9" y="120" width="14" height="8" rx="3" fill="#0A0A0A" />
          <circle cx="16" cy="124" r="3" fill="#1A1A1A" />
          <circle cx="16" cy="124" r="1.5" fill="rgba(255,255,255,0.4)" />
          {/* Crown */}
          <rect x="25" y="122" width="2" height="4" rx="1" fill="#8B7355" />
        </g>
      )}
      {/* Diamond chain wrist cuff */}
      {cfg.accessory === 'acc_diamondchain' && (
        <g>
          <rect x="7" y="121" width="18" height="6" rx="3" fill="#C0C0C0" />
          <circle cx="12" cy="124" r="2" fill="#48C4FF" />
          <circle cx="16" cy="124" r="2" fill="#C084FC" />
          <circle cx="20" cy="124" r="2" fill="#FCD34D" />
        </g>
      )}

      {/* ── NECK ── */}
      <rect x="48" y="76" width="24" height="14" rx="6" fill={skin} />

      {/* ── HEAD ── */}
      <circle cx="60" cy="52" r="38" fill={skin} />

      {/* ── EARS ── */}
      <circle cx="22" cy="54" r="8.5" fill={skin} />
      <circle cx="98" cy="54" r="8.5" fill={skin} />
      <circle cx="22" cy="54" r="4.5" fill="rgba(0,0,0,0.06)" />
      <circle cx="98" cy="54" r="4.5" fill="rgba(0,0,0,0.06)" />

      {/* ── HAIR ── */}
      <HairLayer style={cfg.hair} color={isGalaxyHair ? 'url(#galaxyGrad)' : hair} />

      {/* ── FACE ── */}
      <path d="M33 37 Q43 31 53 37" stroke="#22222280" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M67 37 Q77 31 87 37" stroke="#22222280" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="44" cy="48" r="9"   fill="white" />
      <circle cx="46" cy="49" r="5.5" fill="#1A1A2E" />
      <circle cx="48" cy="47" r="2"   fill="white" />
      <circle cx="76" cy="48" r="9"   fill="white" />
      <circle cx="78" cy="49" r="5.5" fill="#1A1A2E" />
      <circle cx="80" cy="47" r="2"   fill="white" />

      <circle cx="60" cy="58" r="2.5" fill="rgba(0,0,0,0.1)" />
      <path d="M49 66 Q60 76 71 66" stroke="#CC6666" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="59" r="8" fill="rgba(255,130,130,0.18)" />
      <circle cx="86" cy="59" r="8" fill="rgba(255,130,130,0.18)" />

      {/* ── CHAIN / NECKLACE ── */}
      {(cfg.accessory === 'acc_chain' || cfg.accessory === 'acc_diamondchain') && (
        <ChainLayer type={cfg.accessory} />
      )}

      {/* ── ACCESSORY ── */}
      <AccessoryLayer type={cfg.accessory} />
    </svg>
  );
}

function HairLayer({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'hair_short':
      return <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />;

    case 'hair_spiky':
      return (
        <path
          d="M22 54 L30 26 L40 42 L48 14 L58 34 L60 10 L62 34 L72 14 L80 42 L90 26 L98 54 Q98 14 60 14 Q22 14 22 54 Z"
          fill={color}
        />
      );

    case 'hair_fade':
      return (
        <>
          {/* Faded sides — lighter opacity */}
          <path d="M22 54 A38 38 0 0 1 42 18 L44 54 Q32 42 22 54 Z" fill={color} opacity="0.4" />
          <path d="M98 54 A38 38 0 0 0 78 18 L76 54 Q88 42 98 54 Z" fill={color} opacity="0.4" />
          {/* Top clean section */}
          <path d="M42 28 A38 38 0 0 1 78 28 L78 54 L42 54 Z" fill={color} />
          {/* Hard part line */}
          <line x1="42" y1="28" x2="42" y2="54" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        </>
      );

    case 'hair_long':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />
          <path d="M22 56 Q12 90 16 130" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M98 56 Q108 90 104 130" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
        </>
      );

    case 'hair_curly':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />
          <path d="M22 52 Q28 38 36 44 Q42 28 50 34 Q54 18 62 22 Q70 18 74 34 Q82 28 88 44 Q96 38 98 52" fill={color} />
        </>
      );

    case 'hair_mohawk':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 44 18 L48 54 Q34 40 22 54 Z" fill={color} opacity="0.25" />
          <path d="M98 54 A38 38 0 0 0 76 18 L72 54 Q86 40 98 54 Z" fill={color} opacity="0.25" />
          <path d="M48 54 Q48 8 60 4 Q72 8 72 54 Q72 14 60 14 Q48 14 48 54 Z" fill={color} />
        </>
      );

    case 'hair_bun':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />
          <circle cx="60" cy="11" r="13" fill={color} />
          <path d="M48 14 Q60 8 72 14" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" fill="none" />
        </>
      );

    case 'hair_none':
    default:
      return null;
  }
}

function ChainLayer({ type }: { type: string }) {
  if (type === 'acc_chain') {
    return (
      <g>
        <path d="M36 80 Q60 92 84 80" stroke="#B8860B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="44" cy="84" r="2" fill="#FFD700" />
        <circle cx="52" cy="87" r="2" fill="#FFD700" />
        <circle cx="60" cy="89" r="4" fill="#FFD700" />
        <text x="60" y="92" textAnchor="middle" fontSize="4" fill="#7A5C00" fontWeight="bold">$</text>
        <circle cx="68" cy="87" r="2" fill="#FFD700" />
        <circle cx="76" cy="84" r="2" fill="#FFD700" />
      </g>
    );
  }
  // Diamond chain
  return (
    <g>
      <path d="M34 80 Q60 94 86 80" stroke="#A0A0A0" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="43" cy="85" r="2.5" fill="#48C4FF" />
      <circle cx="52" cy="88" r="2.5" fill="#E879F9" />
      <circle cx="60" cy="91" r="5" fill="#1A1A1A" stroke="#A0A0A0" strokeWidth="1" />
      <circle cx="60" cy="91" r="3" fill="#48C4FF" opacity="0.8" />
      <circle cx="68" cy="88" r="2.5" fill="#FCD34D" />
      <circle cx="77" cy="85" r="2.5" fill="#48C4FF" />
    </g>
  );
}

function AccessoryLayer({ type }: { type: string }) {
  switch (type) {
    case 'acc_glasses':
      return (
        <g>
          <circle cx="44" cy="48" r="11" stroke="#666" strokeWidth="2.5" fill="rgba(150,210,255,0.1)" />
          <circle cx="76" cy="48" r="11" stroke="#666" strokeWidth="2.5" fill="rgba(150,210,255,0.1)" />
          <line x1="55" y1="48" x2="65" y2="48" stroke="#666" strokeWidth="2" />
          <line x1="33" y1="46" x2="22" y2="43" stroke="#666" strokeWidth="2" />
          <line x1="87" y1="46" x2="98" y2="43" stroke="#666" strokeWidth="2" />
        </g>
      );

    case 'acc_sunglasses':
      return (
        <g>
          {/* Sleek wrap-around style */}
          <path d="M30 46 Q44 38 58 46 L58 54 Q44 58 30 54 Z" fill="#111" opacity="0.95" />
          <path d="M62 46 Q76 38 90 46 L90 54 Q76 58 62 54 Z" fill="#111" opacity="0.95" />
          <line x1="58" y1="50" x2="62" y2="50" stroke="#333" strokeWidth="2" />
          <line x1="30" y1="50" x2="20" y2="47" stroke="#333" strokeWidth="2" />
          <line x1="90" y1="50" x2="100" y2="47" stroke="#333" strokeWidth="2" />
          {/* Lens sheen */}
          <path d="M33 46 Q44 41 55 46" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M65 46 Q76 41 87 46" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      );

    case 'acc_cap':
      return (
        <g>
          <path d="M22 50 A38 38 0 0 1 98 50 L98 44 Q98 22 60 22 Q22 22 22 44 Z" fill="#1E3A5F" />
          <ellipse cx="60" cy="50" rx="42" ry="6" fill="#1A3355" />
          <circle cx="60" cy="22" r="3.5" fill="#2B4C7E" />
          <rect x="50" y="34" width="20" height="12" rx="2" fill="rgba(255,255,255,0.08)" />
        </g>
      );

    case 'acc_supreme_cap':
      return (
        <g>
          <path d="M22 50 A38 38 0 0 1 98 50 L98 44 Q98 22 60 22 Q22 22 22 44 Z" fill="#CC0000" />
          <ellipse cx="60" cy="50" rx="44" ry="6.5" fill="#AA0000" />
          {/* Supreme box on front */}
          <rect x="46" y="32" width="28" height="14" rx="2" fill="white" />
          <text x="60" y="42" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#CC0000" fontFamily="Arial">SUPREME</text>
          <circle cx="60" cy="22" r="3" fill="#AA0000" />
        </g>
      );

    case 'acc_headphones':
      return (
        <g>
          <path d="M20 52 Q20 8 60 8 Q100 8 100 52" stroke="#222" strokeWidth="7" fill="none" strokeLinecap="round" />
          <rect x="10" y="44" width="18" height="26" rx="9" fill="#333" />
          <rect x="92" y="44" width="18" height="26" rx="9" fill="#333" />
          <circle cx="19" cy="57" r="6" fill="#444" />
          <circle cx="101" cy="57" r="6" fill="#444" />
        </g>
      );

    case 'acc_halo':
      return (
        <ellipse cx="60" cy="6" rx="24" ry="7" stroke="#FFD700" strokeWidth="3.5" fill="rgba(255,215,0,0.15)" />
      );

    case 'acc_crown':
      return (
        <g>
          <path
            d="M32 34 L32 18 L44 28 L60 12 L76 28 L88 18 L88 34 L80 30 L60 20 L40 30 Z"
            fill="#FFD700" stroke="#B7791F" strokeWidth="1.5" strokeLinejoin="round"
          />
          <circle cx="60" cy="20" r="4" fill="#EF4444" />
          <circle cx="44" cy="28" r="3" fill="#3B82F6" />
          <circle cx="76" cy="28" r="3" fill="#10B981" />
        </g>
      );

    case 'acc_trophy':
      return (
        <g transform="translate(92, 70)">
          <path d="M2 0 Q2 18 10 22 Q18 18 18 0 Z" fill="#FFD700" />
          <path d="M2 4 Q-4 10 2 14" stroke="#FFD700" strokeWidth="3" fill="none" />
          <path d="M18 4 Q24 10 18 14" stroke="#FFD700" strokeWidth="3" fill="none" />
          <rect x="8" y="22" width="4" height="8" rx="1" fill="#B7791F" />
          <rect x="4" y="30" width="12" height="3" rx="1.5" fill="#B7791F" />
        </g>
      );

    // chain/diamondchain body layers rendered separately in ChainLayer
    case 'acc_chain':
    case 'acc_diamondchain':
    case 'acc_rolex':
      return null; // handled elsewhere

    case 'acc_none':
    default:
      return null;
  }
}
