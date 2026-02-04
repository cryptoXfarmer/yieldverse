'use client'

import { CelestialObject, Ship, ShipType } from './GalaxyMap'

interface InfoPanelProps {
  selectedShip: Ship | null
  ships: Ship[]
  objects: CelestialObject[]
  onLaunchScout: (shipId: string) => void
  onLaunchMiner: (shipId: string, targetId: string) => void
  onLaunchFighterAttack: (shipId: string, targetId: string) => void
  onSetDefender: (shipId: string) => void
  onRecallShip: (shipId: string) => void
  onBuildShip: (type: ShipType) => void
  onSelectShip: (ship: Ship | null) => void
  onScanAnomaly: (shipId: string, targetId: string) => void
  onAnomalyMission: (shipId: string, targetId: string) => void
  playerResources: { energy: number; minerals: number; credits: number; yes: number }
}

const SHIP_COSTS: Record<ShipType, { energy: number; minerals: number; label: string }> = {
  scout: { energy: 30, minerals: 20, label: 'Auto-explores & reveals fog' },
  miner: { energy: 50, minerals: 40, label: 'Mines asteroids for resources' },
  fighter: { energy: 80, minerals: 60, label: 'Attack enemies or defend' },
}

function BarFill({ pct, type }: { pct: number; type: 'hp' | 'fuel' | 'cargo' }) {
  const cls = type === 'fuel' ? 'bar-fuel' : type === 'cargo' ? 'bar-cargo' : pct > 0.5 ? 'bar-hp' : pct > 0.25 ? 'bar-hp-mid' : 'bar-hp-low'
  return (
    <div className="bar-track">
      <div className={`bar-fill ${cls}`} style={{ width: `${pct * 100}%` }} />
    </div>
  )
}

function Badge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

export default function InfoPanel({
  selectedShip, ships, objects,
  onLaunchScout, onLaunchMiner, onLaunchFighterAttack, onSetDefender,
  onRecallShip, onBuildShip, onSelectShip, onScanAnomaly, onAnomalyMission, playerResources,
}: InfoPanelProps) {

  const dockedShips = ships.filter(s => s.status === 'docked' || s.status === 'refueling')
  const activeShips = ships.filter(s => s.status !== 'docked' && s.status !== 'refueling')
  const mineableTargets = objects.filter(o => o.discovered && (o.type === 'asteroid' || o.type === 'debris') && !o.depleted)
  const attackTargets = objects.filter(o => o.discovered && o.type === 'enemy' && (o.enemyHP || 0) > 0)
  const anomalyTargets = objects.filter(o => o.discovered && o.type === 'anomaly' && !o.anomalyScanning && !o.anomalyMission && !o.depleted && (o.anomalyUses || 0) < 3 && (!o.anomalyCooldownEnd || Date.now() >= o.anomalyCooldownEnd))

  // ════════════════════════════════
  // SHIP DETAIL VIEW
  // ════════════════════════════════
  if (selectedShip) {
    const icon = selectedShip.type === 'scout' ? '🔭' : selectedShip.type === 'miner' ? '⛏️' : '⚔️'
    const isDocked = selectedShip.status === 'docked' || selectedShip.status === 'refueling'
    const canLaunch = selectedShip.status === 'docked' && selectedShip.fuel >= 20
    const hpPct = selectedShip.hp / selectedShip.maxHp
    const fuelPct = selectedShip.fuel / selectedShip.maxFuel
    const cargoPct = selectedShip.maxCargo > 0 ? selectedShip.cargo / selectedShip.maxCargo : 0

    return (
      <div className="h-full flex flex-col">
        <button onClick={() => onSelectShip(null)} className="py-2.5 px-4 text-xs text-gray-600 hover:text-white hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] text-left tracking-wide">
          ← BACK TO HANGAR
        </button>

        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`ship-icon ${selectedShip.type}`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate">{selectedShip.name}</h2>
              <p className="text-[11px] text-gray-500 capitalize">{selectedShip.type}</p>
            </div>
            <Badge status={selectedShip.status} />
          </div>
          
          {/* Bars */}
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>HULL</span><span>{selectedShip.hp}/{selectedShip.maxHp}</span></div>
              <BarFill pct={hpPct} type="hp" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>FUEL</span><span>{selectedShip.fuel}/{selectedShip.maxFuel}</span></div>
              <BarFill pct={fuelPct} type="fuel" />
              {selectedShip.status === 'refueling' && <p className="text-[10px] text-cyan-400 mt-1">⛽ Refueling...</p>}
            </div>
            {selectedShip.type === 'miner' && (
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>CARGO</span><span>{selectedShip.cargo}/{selectedShip.maxCargo}</span></div>
                <BarFill pct={cargoPct} type="cargo" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* ETA */}
          {selectedShip.arriveTime && selectedShip.status === 'moving' && (
            <div className="stat-card text-center">
              <p className="text-[10px] text-gray-500 mb-1">ETA</p>
              <p className="text-2xl font-orbitron font-bold text-blue-400">
                {Math.max(0, Math.ceil((selectedShip.arriveTime - Date.now()) / 1000))}s
              </p>
            </div>
          )}

          {/* ═══ SCOUT ACTIONS ═══ */}
          {selectedShip.type === 'scout' && canLaunch && (
            <div className="space-y-3">
              <button onClick={() => onLaunchScout(selectedShip.id)} className="btn-action btn-scout">
                🚀 Launch — Auto Explore
              </button>
              {anomalyTargets.length > 0 && (
                <div>
                  <p className="text-[10px] sb-label mb-2">ANOMALY SCAN</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {anomalyTargets.map(t => (
                      <button key={t.id} onClick={() => onScanAnomaly(selectedShip.id, t.id)}
                        className="ship-card !p-2.5">
                        <div className="ship-icon" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', fontSize: 14, width: 32, height: 32 }}>🌀</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{t.name}</p>
                          <p className="text-[10px] text-purple-400">Scan 2-5m · {3 - (t.anomalyUses || 0)} left</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedShip.type === 'scout' && selectedShip.status === 'scouting' && (
            <div className="stat-card text-center">
              <p className="text-sky-400 text-sm font-medium">🔭 Exploring...</p>
              <p className="text-[10px] text-gray-600 mt-1">Auto-discovering new sectors</p>
            </div>
          )}
          {selectedShip.type === 'scout' && selectedShip.status === 'scanning' && (
            <div className="stat-card text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
              <p className="text-purple-400 text-sm font-medium">Scanning Anomaly...</p>
            </div>
          )}

          {/* ═══ MINER ACTIONS ═══ */}
          {selectedShip.type === 'miner' && canLaunch && mineableTargets.length > 0 && (
            <div>
              <p className="text-[10px] sb-label mb-2">MINE TARGET</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {mineableTargets.map(t => (
                  <button key={t.id} onClick={() => onLaunchMiner(selectedShip.id, t.id)}
                    className="ship-card !p-2.5">
                    <div className="ship-icon" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 14, width: 32, height: 32 }}>🪨</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.name}</p>
                      <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span className="text-yellow-400">⚡{t.resources?.energy}</span>
                        <span className="text-purple-400">💎{t.resources?.minerals}</span>
                        <span className="text-green-400">💰{t.resources?.credits}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedShip.type === 'miner' && selectedShip.status === 'mining' && (
            <div className="stat-card text-center">
              <p className="text-amber-400 text-sm font-medium">⛏️ Mining in progress...</p>
              <p className="text-[10px] text-gray-600 mt-1">Cargo: {selectedShip.cargo}/{selectedShip.maxCargo}</p>
            </div>
          )}

          {/* ═══ FIGHTER ACTIONS ═══ */}
          {selectedShip.type === 'fighter' && canLaunch && (
            <div className="space-y-3">
              <button onClick={() => onSetDefender(selectedShip.id)} className="btn-action btn-green">
                🛡️ Set Defense Mode
              </button>
              {attackTargets.length > 0 && (
                <div>
                  <p className="text-[10px] sb-label mb-2">ATTACK TARGET</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {attackTargets.map(t => (
                      <button key={t.id} onClick={() => onLaunchFighterAttack(selectedShip.id, t.id)}
                        className="ship-card !p-2.5">
                        <div className="ship-icon" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 14, width: 32, height: 32 }}>👾</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{t.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bar-track"><div className="bar-fill bar-hp-low" style={{ width: `${((t.enemyHP || 0) / (t.enemyMaxHP || 1)) * 100}%` }} /></div>
                            <span className="text-[10px] text-red-400">{t.enemyHP}hp</span>
                          </div>
                          <p className="text-[10px] text-yellow-500 mt-0.5">🎁 {t.loot}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Hostile Planets */}
              {objects.filter(o => o.discovered && o.type === 'planet' && o.hostile && (o.enemyHP || 0) > 0).length > 0 && (
                <div>
                  <p className="text-[10px] sb-label mb-2">CONQUER PLANET</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {objects.filter(o => o.discovered && o.type === 'planet' && o.hostile && (o.enemyHP || 0) > 0).map(t => (
                      <button key={t.id} onClick={() => onLaunchFighterAttack(selectedShip.id, t.id)}
                        className="ship-card !p-2.5">
                        <div className="ship-icon" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 14, width: 32, height: 32 }}>🔴</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{t.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bar-track"><div className="bar-fill bar-hp-low" style={{ width: `${((t.enemyHP || 0) / (t.enemyMaxHP || 1)) * 100}%` }} /></div>
                            <span className="text-[10px] text-red-400">{t.enemyHP}hp</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Anomaly missions */}
              {anomalyTargets.length > 0 && (
                <div>
                  <p className="text-[10px] sb-label mb-2">ANOMALY MISSION</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {anomalyTargets.map(t => (
                      <button key={t.id} onClick={() => onAnomalyMission(selectedShip.id, t.id)}
                        className="ship-card !p-2.5">
                        <div className="ship-icon" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', fontSize: 14, width: 32, height: 32 }}>🌀</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{t.name}</p>
                          <p className="text-[10px] text-purple-400">⚔️ 3-5m combat · {3 - (t.anomalyUses || 0)} left</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedShip.status === 'fighting' && (
            <div className="stat-card text-center border-red-500/20">
              <p className="text-red-400 text-sm font-medium">⚔️ In Combat</p>
              <p className="text-[10px] text-gray-600 mt-1">Auto-attacking every 3s</p>
            </div>
          )}
          {selectedShip.status === 'defending' && (
            <div className="stat-card text-center border-green-500/20">
              <p className="text-green-400 text-sm font-medium">🛡️ Defense Standby</p>
              <p className="text-[10px] text-gray-600 mt-1">Auto-responds to distress calls</p>
            </div>
          )}

          {/* Recall */}
          {!isDocked && (
            <button onClick={() => onRecallShip(selectedShip.id)} className="btn-action btn-ghost text-sm">
              📡 {selectedShip.status === 'defending' ? 'Cancel Defense' : 'Recall to Base'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════════
  // HANGAR LIST
  // ════════════════════════════════
  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <h2 className="text-sm font-bold">Fleet Hangar</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">Select a ship to deploy</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {dockedShips.length > 0 && (
          <div>
            <p className="sb-label mb-2">READY ({dockedShips.length})</p>
            <div className="space-y-1.5">
              {dockedShips.map(ship => {
                const icon = ship.type === 'scout' ? '🔭' : ship.type === 'miner' ? '⛏️' : '⚔️'
                return (
                  <button key={ship.id} onClick={() => onSelectShip(ship)} className="ship-card">
                    <div className={`ship-icon ${ship.type}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{ship.name}</p>
                      <p className="text-[10px] text-gray-600 capitalize">{ship.type} · HP {ship.hp}/{ship.maxHp}</p>
                    </div>
                    <span className="text-[10px] text-cyan-400/60">▸</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activeShips.length > 0 && (
          <div>
            <p className="sb-label mb-2">DEPLOYED ({activeShips.length})</p>
            <div className="space-y-1.5">
              {activeShips.map(ship => {
                const icon = ship.type === 'scout' ? '🔭' : ship.type === 'miner' ? '⛏️' : '⚔️'
                return (
                  <button key={ship.id} onClick={() => onSelectShip(ship)}
                    className="ship-card" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                    <div className={`ship-icon ${ship.type}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{ship.name}</p>
                      <p className={`text-[10px] capitalize ${
                        ship.status === 'defending' ? 'text-green-400' :
                        ship.status === 'mining' ? 'text-amber-400' :
                        ship.status === 'fighting' ? 'text-red-400' :
                        ship.status === 'scouting' ? 'text-sky-400' :
                        'text-blue-400'
                      }`}>{ship.status}
                        {ship.arriveTime && ship.status === 'moving' ? ` — ${Math.max(0, Math.ceil((ship.arriveTime - Date.now()) / 1000))}s` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-600">▸</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Build */}
        <div className="pt-2 border-t border-white/[0.04]">
          <p className="sb-label mb-2">BUILD SHIP</p>
          <div className="space-y-1.5">
            {(['scout', 'miner', 'fighter'] as ShipType[]).map(type => {
              const cost = SHIP_COSTS[type]
              const canAfford = playerResources.energy >= cost.energy && playerResources.minerals >= cost.minerals
              const icon = type === 'scout' ? '🔭' : type === 'miner' ? '⛏️' : '⚔️'
              return (
                <button key={type} onClick={() => onBuildShip(type)} disabled={!canAfford}
                  className="ship-card disabled:opacity-30 disabled:cursor-not-allowed">
                  <div className={`ship-icon ${type}`}>{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs capitalize">{type}</p>
                    <p className="text-[10px] text-gray-600">⚡{cost.energy} + 💎{cost.minerals}</p>
                  </div>
                  <span className="text-[10px] text-gray-600">Build</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
