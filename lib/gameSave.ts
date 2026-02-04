import { supabase } from './supabase'
import type { CelestialObject, Ship } from '@/components/GalaxyMap'
import type { Building } from '@/components/PlanetView'

// ═══════════════════════════════════════════
// STARFORGE SAVE SYSTEM
// ═══════════════════════════════════════════

export interface GameSave {
  resources: { energy: number; minerals: number; credits: number; yes: number }
  buildings: Building[]
  ships: Ship[]
  world: CelestialObject[]
  scannedAreas: { x: number; y: number; radius: number }[]
  shipCount: number
  stats: {
    totalEnemiesKilled: number
    totalResourcesMined: number
    totalAnomaliesScanned: number
    playTimeSeconds: number
  }
}

// Generate or retrieve anonymous player ID
export function getPlayerId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('starforge_player_id')
  if (!id) {
    id = `pilot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('starforge_player_id', id)
  }
  return id
}

// ═══════════════════════════════════════════
// SAVE GAME
// ═══════════════════════════════════════════
export async function saveGame(save: GameSave): Promise<{ success: boolean; error?: string }> {
  const playerId = getPlayerId()

  // Prepare ships for save — reset moving ships to docked at their current position
  const savedShips = save.ships.map(s => ({
    ...s,
    status: (s.status === 'mining' || s.status === 'fighting' || s.status === 'scanning' || s.status === 'scouting')
      ? 'docked' : s.status === 'moving' ? 'docked' : s.status,
    targetX: null, targetY: null,
    departTime: null, arriveTime: null,
  }))

  // Clean world — remove active timers
  const savedWorld = save.world.map(o => ({
    ...o,
    anomalyScanning: false,
    anomalyScanEnd: null,
    anomalyMission: false,
    anomalyMissionEnd: null,
  }))

  try {
    const { error } = await supabase
      .from('starforge_saves')
      .upsert({
        player_id: playerId,
        energy: save.resources.energy,
        minerals: save.resources.minerals,
        credits: save.resources.credits,
        yes_tokens: save.resources.yes,
        buildings: save.buildings,
        ships: savedShips,
        world: savedWorld,
        scanned_areas: save.scannedAreas,
        ship_count: save.shipCount,
        total_enemies_killed: save.stats.totalEnemiesKilled,
        total_resources_mined: save.stats.totalResourcesMined,
        total_anomalies_scanned: save.stats.totalAnomaliesScanned,
        play_time_seconds: save.stats.playTimeSeconds,
      }, { onConflict: 'player_id' })

    if (error) {
      console.error('Save failed:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error('Save error:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

// ═══════════════════════════════════════════
// LOAD GAME
// ═══════════════════════════════════════════
export async function loadGame(): Promise<{ save: GameSave | null; error?: string }> {
  const playerId = getPlayerId()

  try {
    const { data, error } = await supabase
      .from('starforge_saves')
      .select('*')
      .eq('player_id', playerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No save found — new player
        return { save: null }
      }
      console.error('Load failed:', error)
      return { save: null, error: error.message }
    }

    if (!data) return { save: null }

    // Reconstruct game state
    const save: GameSave = {
      resources: {
        energy: data.energy,
        minerals: data.minerals,
        credits: data.credits,
        yes: data.yes_tokens,
      },
      buildings: data.buildings as Building[],
      ships: (data.ships as Ship[]).map(s => ({
        ...s,
        // Ensure all docked ships are at home and refueled
        status: 'docked' as Ship['status'],
        targetX: null,
        targetY: null,
        departTime: null,
        arriveTime: null,
      })),
      world: data.world as CelestialObject[],
      scannedAreas: data.scanned_areas as { x: number; y: number; radius: number }[],
      shipCount: data.ship_count,
      stats: {
        totalEnemiesKilled: data.total_enemies_killed || 0,
        totalResourcesMined: data.total_resources_mined || 0,
        totalAnomaliesScanned: data.total_anomalies_scanned || 0,
        playTimeSeconds: data.play_time_seconds || 0,
      },
    }

    return { save }
  } catch (err: any) {
    console.error('Load error:', err)
    return { save: null, error: err.message || 'Unknown error' }
  }
}

// ═══════════════════════════════════════════
// DELETE SAVE (reset)
// ═══════════════════════════════════════════
export async function deleteSave(): Promise<boolean> {
  const playerId = getPlayerId()
  try {
    const { error } = await supabase
      .from('starforge_saves')
      .delete()
      .eq('player_id', playerId)
    return !error
  } catch {
    return false
  }
}
