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

  // Sleeve = outfit color for hoodies/jackets; skin for basic shirts
  const sleeve = cfg.outfit === 'outfit_basic' ? skin : outfit;

  // Pant color (always dark, slight outfit tint)
  const pants = '#2D3748';

  const h = size * 1.5;

  return (
    <svg
      viewBox="0 0 120 180"
      width={size}
      height={h}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Drop shadow */}
      <ellipse cx="60" cy="178" rx="30" ry="4" fill="rgba(0,0,0,0.18)" />

      {/* ── LEGS ── */}
      <rect x="33" y="138" width="22" height="38" rx="10" fill={pants} />
      <rect x="65" y="138" width="22" height="38" rx="10" fill={pants} />
      {/* Shoes */}
      <ellipse cx="44" cy="174" rx="15" ry="6.5" fill="#111827" />
      <ellipse cx="76" cy="174" rx="15" ry="6.5" fill="#111827" />
      <ellipse cx="44" cy="172" rx="10" ry="3.5" fill="#1F2937" />
      <ellipse cx="76" cy="172" rx="10" ry="3.5" fill="#1F2937" />

      {/* ── BODY ── */}
      <rect x="24" y="84" width="72" height="58" rx="14" fill={outfit} />

      {/* Outfit detail */}
      {cfg.outfit === 'outfit_suit' && (
        <>
          {/* White shirt / collar */}
          <rect x="51" y="84" width="18" height="30" rx="4" fill="#F9FAFB" />
          {/* Tie */}
          <path d="M58 88 L62 88 L64 108 L60 112 L56 108 Z" fill="#DC2626" />
        </>
      )}
      {cfg.outfit === 'outfit_winner' && (
        <path d="M24 96 L60 90 L96 96" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
      )}
      {cfg.outfit === 'outfit_legend' && (
        <>
          <path d="M24 100 Q60 92 96 100" stroke="#9F7AEA" strokeWidth="1.5" fill="none" />
          <path d="M24 112 Q60 104 96 112" stroke="#9F7AEA" strokeWidth="1.5" fill="none" />
        </>
      )}
      {cfg.outfit === 'outfit_cyber' && (
        <>
          <rect x="28" y="92" width="6" height="6" rx="1" fill="rgba(0,255,255,0.5)" />
          <rect x="86" y="92" width="6" height="6" rx="1" fill="rgba(0,255,255,0.5)" />
          <path d="M34 95 L86 95" stroke="rgba(0,255,255,0.3)" strokeWidth="1" fill="none" />
        </>
      )}

      {/* ── ARMS ── */}
      <rect x="6"  y="88" width="20" height="44" rx="10" fill={sleeve} />
      <rect x="94" y="88" width="20" height="44" rx="10" fill={sleeve} />

      {/* ── HANDS ── */}
      <circle cx="16"  cy="133" r="11" fill={skin} />
      <circle cx="104" cy="133" r="11" fill={skin} />

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
      <HairLayer style={cfg.hair} color={hair} />

      {/* ── FACE ── */}
      {/* Eyebrows */}
      <path d="M33 37 Q43 31 53 37" stroke={hair === '#E8E8E8' ? '#999' : '#222'} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M67 37 Q77 31 87 37" stroke={hair === '#E8E8E8' ? '#999' : '#222'} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Left eye */}
      <circle cx="44" cy="48" r="9"   fill="white" />
      <circle cx="46" cy="49" r="5.5" fill="#1A1A2E" />
      <circle cx="48" cy="47" r="2"   fill="white" />

      {/* Right eye */}
      <circle cx="76" cy="48" r="9"   fill="white" />
      <circle cx="78" cy="49" r="5.5" fill="#1A1A2E" />
      <circle cx="80" cy="47" r="2"   fill="white" />

      {/* Nose */}
      <circle cx="60" cy="58" r="2.5" fill="rgba(0,0,0,0.1)" />

      {/* Mouth */}
      <path d="M49 66 Q60 76 71 66" stroke="#CC6666" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Blush */}
      <circle cx="34" cy="59" r="8" fill="rgba(255,130,130,0.18)" />
      <circle cx="86" cy="59" r="8" fill="rgba(255,130,130,0.18)" />

      {/* ── ACCESSORY ── */}
      <AccessoryLayer type={cfg.accessory} />
    </svg>
  );
}

function HairLayer({ style, color }: { style: string; color: string }) {
  // Head: cx=60 cy=52 r=38 → top at y=14, left at x=22, right at x=98
  switch (style) {
    case 'hair_short':
      return (
        <path
          d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z"
          fill={color}
        />
      );

    case 'hair_spiky':
      return (
        <path
          d="M22 54 L30 26 L40 42 L48 14 L58 34 L60 10 L62 34 L72 14 L80 42 L90 26 L98 54 Q98 14 60 14 Q22 14 22 54 Z"
          fill={color}
        />
      );

    case 'hair_long':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />
          {/* Side strands */}
          <path d="M22 56 Q12 90 16 130" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M98 56 Q108 90 104 130" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
        </>
      );

    case 'hair_curly':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />
          {/* Curly bumps above */}
          <path
            d="M22 52 Q28 38 36 44 Q42 28 50 34 Q54 18 62 22 Q70 18 74 34 Q82 28 88 44 Q96 38 98 52"
            fill={color}
          />
        </>
      );

    case 'hair_mohawk':
      return (
        <>
          {/* Shaved sides hint */}
          <path d="M22 54 A38 38 0 0 1 44 18 L48 54 Q34 40 22 54 Z" fill={color} opacity="0.3" />
          <path d="M98 54 A38 38 0 0 0 76 18 L72 54 Q86 40 98 54 Z" fill={color} opacity="0.3" />
          {/* Center strip */}
          <path d="M48 54 Q48 8 60 4 Q72 8 72 54 Q72 14 60 14 Q48 14 48 54 Z" fill={color} />
        </>
      );

    case 'hair_bun':
      return (
        <>
          <path d="M22 54 A38 38 0 0 1 98 54 Q98 14 60 14 Q22 14 22 54 Z" fill={color} />
          {/* Bun on top */}
          <circle cx="60" cy="11" r="13" fill={color} />
          {/* Bun detail line */}
          <path d="M48 14 Q60 8 72 14" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" fill="none" />
        </>
      );

    case 'hair_none':
    default:
      return null;
  }
}

function AccessoryLayer({ type }: { type: string }) {
  switch (type) {
    case 'acc_glasses':
      return (
        <g>
          <circle cx="44" cy="48" r="11" stroke="#555" strokeWidth="2.5" fill="rgba(150,210,255,0.15)" />
          <circle cx="76" cy="48" r="11" stroke="#555" strokeWidth="2.5" fill="rgba(150,210,255,0.15)" />
          {/* Bridge */}
          <line x1="55" y1="48" x2="65" y2="48" stroke="#555" strokeWidth="2" />
          {/* Temples */}
          <line x1="33" y1="46" x2="22" y2="43" stroke="#555" strokeWidth="2" />
          <line x1="87" y1="46" x2="98" y2="43" stroke="#555" strokeWidth="2" />
        </g>
      );

    case 'acc_cap':
      return (
        <g>
          {/* Cap body */}
          <path d="M22 50 A38 38 0 0 1 98 50 L98 44 Q98 22 60 22 Q22 22 22 44 Z" fill="#1E3A5F" />
          {/* Brim */}
          <ellipse cx="60" cy="50" rx="42" ry="6" fill="#1A3355" />
          {/* Button on top */}
          <circle cx="60" cy="22" r="3.5" fill="#2B4C7E" />
          {/* Logo area */}
          <rect x="50" y="34" width="20" height="12" rx="2" fill="rgba(255,255,255,0.08)" />
        </g>
      );

    case 'acc_headphones':
      return (
        <g>
          {/* Arc over head */}
          <path d="M20 52 Q20 8 60 8 Q100 8 100 52" stroke="#222" strokeWidth="7" fill="none" strokeLinecap="round" />
          {/* Cups */}
          <rect x="10" y="44" width="18" height="26" rx="9" fill="#333" />
          <rect x="92" y="44" width="18" height="26" rx="9" fill="#333" />
          {/* Speaker mesh */}
          <circle cx="19" cy="57" r="6" fill="#444" />
          <circle cx="101" cy="57" r="6" fill="#444" />
        </g>
      );

    case 'acc_halo':
      return (
        <g>
          <ellipse cx="60" cy="6" rx="24" ry="7" stroke="#FFD700" strokeWidth="3.5" fill="rgba(255,215,0,0.15)" />
        </g>
      );

    case 'acc_crown':
      return (
        <g>
          <path
            d="M32 34 L32 18 L44 28 L60 12 L76 28 L88 18 L88 34 L80 30 L60 20 L40 30 Z"
            fill="#FFD700"
            stroke="#B7791F"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Gems */}
          <circle cx="60" cy="20" r="4" fill="#EF4444" />
          <circle cx="44" cy="28" r="3" fill="#3B82F6" />
          <circle cx="76" cy="28" r="3" fill="#10B981" />
        </g>
      );

    case 'acc_trophy':
      return (
        <g transform="translate(92, 70)">
          {/* Cup */}
          <path d="M2 0 Q2 18 10 22 Q18 18 18 0 Z" fill="#FFD700" />
          {/* Handles */}
          <path d="M2 4 Q-4 10 2 14" stroke="#FFD700" strokeWidth="3" fill="none" />
          <path d="M18 4 Q24 10 18 14" stroke="#FFD700" strokeWidth="3" fill="none" />
          {/* Stem */}
          <rect x="8" y="22" width="4" height="8" rx="1" fill="#B7791F" />
          {/* Base */}
          <rect x="4" y="30" width="12" height="3" rx="1.5" fill="#B7791F" />
        </g>
      );

    case 'acc_none':
    default:
      return null;
  }
}
