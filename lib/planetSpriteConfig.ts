// ═══════════════════════════════════════════════════════
// PLANET SPRITE CONFIG — Multi-Sheet Registry
// ═══════════════════════════════════════════════════════
// Each rarity has MULTIPLE sprite sheets (3-5 sheets)
// Each sheet has 5 rows × 4 cols = 5 planet types × 4 rotation frames
// DB stores: rarity + sprite_sheet (which file) + visual_type (which row)
// Total unique planets: 80!
// ═══════════════════════════════════════════════════════

export type PlanetRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type PlanetVisualType = 0 | 1 | 2 | 3 | 4

// ═══ SPRITE SHEET FORMAT (all sheets) ═══
export const SPRITE_COLS = 4
export const SPRITE_ROWS = 5
export const SPRITE_TITLE_OFFSET = 115

// ═══ RARITY → SPRITE SHEET ARRAYS ═══
export const RARITY_SHEETS: Record<PlanetRarity, string[]> = {
  common:    ['/sprites/common_1.png', '/sprites/common_2.png', '/sprites/common_3.png', '/sprites/common_4.png', '/sprites/common_5.png'],
  rare:      ['/sprites/rare_1.png', '/sprites/rare_2.png', '/sprites/rare_3.png', '/sprites/rare_4.png'],
  epic:      ['/sprites/epic_1.png', '/sprites/epic_2.png', '/sprites/epic_3.png', '/sprites/epic_4.png'],
  legendary: ['/sprites/legendary_1.png', '/sprites/legendary_2.png', '/sprites/legendary_3.png'],
}

// ═══ VISUAL TYPE NAMES PER ROW (shared across sheets of same rarity) ═══
export const RARITY_ROW_NAMES: Record<PlanetRarity, string[]> = {
  common: ['Terra', 'Gaia', 'Dustball', 'Ice Moon', 'Barren'],
  rare: ['Ocean World', 'Jade Forest', 'Ember Spike', 'Twilight', 'Crystal Shard'],
  epic: ['Storm Giant', 'Magma Core', 'Bio Sphere', 'Void Walker', 'Toxic Forge'],
  legendary: ['Inferno', 'Dark Volcanic', 'Crystal Storm', 'Emerald', 'Prismatic'],
}

// ═══ SHEET VARIANT NAMES (flavor for each sheet within a rarity) ═══
export const SHEET_VARIANT_NAMES: Record<PlanetRarity, string[]> = {
  common: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
  rare: ['Mk-I', 'Mk-II', 'Mk-III', 'Mk-IV'],
  epic: ['Prime', 'Nova', 'Apex', 'Omega'],
  legendary: ['Genesis', 'Mechanical', 'Living World'],
}

// ═══ TOTAL UNIQUE COUNTS ═══
export const TOTAL_UNIQUE: Record<PlanetRarity, number> = {
  common: 25,    // 5 sheets × 5 rows
  rare: 20,      // 4 sheets × 5 rows
  epic: 20,      // 4 sheets × 5 rows
  legendary: 15, // 3 sheets × 5 rows
}

// ═══ GLOW & STYLE PER RARITY ═══
export const RARITY_GLOW_COLORS: Record<PlanetRarity, {
  primary: string; shadow: string; ring: string;
  label: string; bgGradient: string;
}> = {
  common: {
    primary: '#9CA3AF',
    shadow: '0 0 15px rgba(156,163,175,0.2)',
    ring: 'rgba(156,163,175,0.12)',
    label: 'text-gray-400 border-gray-500/40 bg-gray-500/10',
    bgGradient: 'from-gray-600 to-gray-800',
  },
  rare: {
    primary: '#3B82F6',
    shadow: '0 0 25px rgba(59,130,246,0.3), 0 0 50px rgba(59,130,246,0.1)',
    ring: 'rgba(59,130,246,0.2)',
    label: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    bgGradient: 'from-blue-600 to-blue-900',
  },
  epic: {
    primary: '#7C3AED',
    shadow: '0 0 35px rgba(124,58,237,0.4), 0 0 70px rgba(124,58,237,0.15)',
    ring: 'rgba(124,58,237,0.25)',
    label: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    bgGradient: 'from-purple-600 to-purple-900',
  },
  legendary: {
    primary: '#FBBF24',
    shadow: '0 0 40px rgba(251,191,36,0.4), 0 0 80px rgba(251,191,36,0.15)',
    ring: 'rgba(251,191,36,0.3)',
    label: 'text-yellow-400 border-yellow-400/40 bg-yellow-500/10',
    bgGradient: 'from-yellow-500 to-orange-600',
  },
}

// ═══ ANIMATION SPEED PER RARITY ═══
export const RARITY_FPS: Record<PlanetRarity, number> = {
  // Slower rotation (the sprite frames represent the planet spinning)
  common: 4, rare: 5, epic: 6, legendary: 7,
}

// Global cinematic multiplier for planet rotation speed.
// Lower = slower. Tweak this single number to speed up / slow down everywhere.
// Suggested range:
//   - 0.55 = chill
//   - 0.45 = slow
//   - 0.35 = cinematic (default)
export const PLANET_ROTATION_SPEED_MULTIPLIER = 0.35

// ═══ HELPER FUNCTIONS ═══

/** Get random sheet index for a rarity */
export function getRandomSheetIndex(rarity: PlanetRarity): number {
  return Math.floor(Math.random() * RARITY_SHEETS[rarity].length)
}

/** Get random visual type (row 0-4) */
export function getRandomVisualType(): PlanetVisualType {
  return Math.floor(Math.random() * SPRITE_ROWS) as PlanetVisualType
}

/** Get sprite sheet path by rarity + sheet index */
export function getSpriteSheet(rarity: PlanetRarity, sheetIndex: number = 0): string {
  const sheets = RARITY_SHEETS[rarity]
  const idx = Math.max(0, Math.min(sheetIndex, sheets.length - 1))
  return sheets[idx]
}

/** Get display name for a planet: "Inferno Mk-II" */
export function getVisualName(rarity: PlanetRarity, visualType: PlanetVisualType, sheetIndex: number = 0): string {
  const rowName = RARITY_ROW_NAMES[rarity][visualType] || `Type ${visualType}`
  const variant = SHEET_VARIANT_NAMES[rarity][sheetIndex] || ''
  return variant ? `${rowName} ${variant}` : rowName
}

/** Get full render config for a planet */
export function getPlanetRenderConfig(rarity: PlanetRarity, sheetIndex: number, visualType: PlanetVisualType) {
  return {
    spriteSheet: getSpriteSheet(rarity, sheetIndex),
    cols: SPRITE_COLS,
    rows: SPRITE_ROWS,
    fps: RARITY_FPS[rarity],
    titleOffset: SPRITE_TITLE_OFFSET,
    planetRow: visualType,
    rarity,
    glow: RARITY_GLOW_COLORS[rarity],
    visualName: getVisualName(rarity, visualType, sheetIndex),
  }
}

/** Generate random planet visuals for a claim */
export function generateRandomVisuals(rarity: PlanetRarity) {
  return {
    sprite_sheet: getRandomSheetIndex(rarity),
    visual_type: getRandomVisualType(),
  }
}
