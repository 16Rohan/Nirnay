import React, { useState } from 'react'
import { Shield, MapPin, Code2, AlertTriangle } from 'lucide-react'
import type { TacticalEntity2D, TacticalObjective2D, TacticalEvent2D } from '../../types/tactical_arena_2d'

interface TacticalInspectorProps {
  selectedEntity: TacticalEntity2D | null
  selectedObjective: TacticalObjective2D | null
  hoveredEntity: TacticalEntity2D | null
  allEntities: TacticalEntity2D[]
  events: TacticalEvent2D[]
  onSelectEntity: (id: string | null) => void
  onClose: () => void
}

/**
 * Tactical inspector panel.
 * Uses the NIRNAY UI dark/branded aesthetic (dark panel, subtle highlights)
 * while the MAP itself uses the cartographic natural palette.
 * This preserves the "NIRNAY UI = dark/technical, MAP = natural/cartographic" split.
 */
export const TacticalInspector: React.FC<TacticalInspectorProps> = ({
  selectedEntity,
  selectedObjective,
  hoveredEntity,
  allEntities,
  events,
  onSelectEntity,
  onClose,
}) => {
  const [showJson, setShowJson] = useState(false)
  const activeUnit = selectedEntity || hoveredEntity

  // ORBAT calculations
  const blueForces = allEntities.filter(e => e.faction === 'BLUE')
  const redForces = allEntities.filter(e => e.faction === 'RED')

  const blueActive = blueForces.filter(e => e.status === 'ACTIVE').length
  const blueDamaged = blueForces.filter(e => e.status === 'DAMAGED').length
  const blueDestroyed = blueForces.filter(e => e.status === 'DESTROYED').length

  const redActive = redForces.filter(e => e.status === 'ACTIVE').length
  const redDamaged = redForces.filter(e => e.status === 'DAMAGED').length
  const redDestroyed = redForces.filter(e => e.status === 'DESTROYED').length

  const avgStrength = (forces: TacticalEntity2D[]) => {
    if (forces.length === 0) return 0
    return Math.round(forces.reduce((s, e) => s + e.strength.currentStrength, 0) / forces.length)
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400'
      case 'DAMAGED': return 'text-amber-400'
      case 'DESTROYED': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="w-full flex flex-col gap-3 font-mono text-xs">

      {/* ── Selected / Hovered Unit Profile ── */}
      {activeUnit ? (
        <div className="bg-[#0a1120] border border-slate-700/60 rounded-lg p-4 space-y-3 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm border ${
                activeUnit.faction === 'BLUE'
                  ? 'bg-blue-700 border-blue-500'
                  : 'bg-red-800 border-red-600'
              }`} />
              <span className="font-bold text-white text-sm tracking-wide">{activeUnit.id}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 tracking-wider uppercase">
                {activeUnit.unitClass}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowJson(v => !v)}
                className={`p-1.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${
                  showJson
                    ? 'bg-blue-900/40 border-blue-600/50 text-blue-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="View contract JSON"
              >
                <Code2 className="w-3 h-3" />
                <span>JSON</span>
              </button>
              {selectedEntity && (
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* JSON view */}
          {showJson ? (
            <div className="bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto max-h-48 text-[10px] text-emerald-400 leading-relaxed">
              <pre>{JSON.stringify(activeUnit.rawJson || {
                entity_id: activeUnit.id,
                team: activeUnit.faction,
                entity_type: activeUnit.category,
                unit_class: activeUnit.unitClass,
                status: activeUnit.status,
                strength: { current: activeUnit.strength.currentStrength, maximum: 100 },
                position: activeUnit.position,
              }, null, 2)}</pre>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Status & Strength row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Status</div>
                  <div className={`font-bold ${statusColor(activeUnit.status)}`}>
                    {activeUnit.status}
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Strength</div>
                  <div className="font-bold text-white">{activeUnit.strength.currentStrength}%</div>
                  {/* Visual strength bar */}
                  <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        activeUnit.strength.currentStrength > 70 ? 'bg-emerald-500'
                        : activeUnit.strength.currentStrength > 40 ? 'bg-amber-500'
                        : 'bg-red-500'
                      }`}
                      style={{ width: `${activeUnit.strength.currentStrength}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category & Position */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Category</div>
                  <div className="font-bold text-slate-200">{activeUnit.category}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Grid Pos</div>
                  <div className="font-bold text-slate-200 text-[10px]">
                    {Math.round(activeUnit.position.x)}, {Math.round(activeUnit.position.y)}
                  </div>
                </div>
              </div>

              {/* Air unit altitude */}
              {activeUnit.category === 'AIR' && activeUnit.altitude && (
                <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Altitude / Speed</div>
                  <div className="font-bold text-slate-200">
                    {activeUnit.altitude.toLocaleString()}m · {activeUnit.speed} km/h
                  </div>
                </div>
              )}

              {/* Last event */}
              {activeUnit.lastEvent && (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded p-2">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Last Adjudicated Action</div>
                  <div className="text-slate-300 leading-relaxed">{activeUnit.lastEvent}</div>
                </div>
              )}

              {/* Faction indicator */}
              <div className={`text-[9px] tracking-wider text-center py-1.5 rounded border font-bold ${
                activeUnit.faction === 'BLUE'
                  ? 'text-blue-300 border-blue-800/40 bg-blue-950/20'
                  : 'text-red-300 border-red-800/40 bg-red-950/20'
              }`}>
                {activeUnit.faction} FORCE · {activeUnit.name}
              </div>
            </div>
          )}
        </div>
      ) : selectedObjective ? (
        // ── Selected Objective Panel ──
        <div className="bg-[#0a1120] border border-slate-700/60 rounded-lg p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm">{selectedObjective.name}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
              <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Sector Control</div>
              <div className={`font-bold ${
                selectedObjective.state === 'SECURED' ? 'text-emerald-400'
                : selectedObjective.state === 'CONTESTED' ? 'text-amber-400'
                : selectedObjective.state === 'FAILED' ? 'text-red-400'
                : 'text-slate-300'
              }`}>{selectedObjective.state}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
              <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Grid Location</div>
              <div className="font-bold text-slate-200 text-[10px]">
                {Math.round(selectedObjective.position.x)}, {Math.round(selectedObjective.position.y)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Theater ORBAT Summary ── */}
      <div className="bg-[#0a1120] border border-slate-800/70 rounded-lg p-4 space-y-3">
        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between">
          <span>Order of Battle</span>
          <Shield className="w-3.5 h-3.5 text-slate-500" />
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {/* Blue ORBAT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] pb-1 border-b border-blue-900/40">
              <span className="text-blue-400 font-bold tracking-wider">BLUE</span>
              <span className="text-slate-400">{blueForces.length} units</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Active</span>
                <span className="text-emerald-400 font-bold">{blueActive}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Damaged</span>
                <span className="text-amber-400 font-bold">{blueDamaged}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Destroyed</span>
                <span className="text-red-400 font-bold">{blueDestroyed}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Avg Strength</span>
                <span className="text-blue-300 font-bold">{avgStrength(blueForces)}%</span>
              </div>
            </div>
          </div>

          {/* Red ORBAT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] pb-1 border-b border-red-900/40">
              <span className="text-red-400 font-bold tracking-wider">RED</span>
              <span className="text-slate-400">{redForces.length} units</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Active</span>
                <span className="text-emerald-400 font-bold">{redActive}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Damaged</span>
                <span className="text-amber-400 font-bold">{redDamaged}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Destroyed</span>
                <span className="text-red-400 font-bold">{redDestroyed}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Avg Strength</span>
                <span className="text-red-300 font-bold">{avgStrength(redForces)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Events Log ── */}
      {events.length > 0 && (
        <div className="bg-[#0a1120] border border-slate-800/70 rounded-lg p-3 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Events</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {events.slice(-5).reverse().map((evt, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  evt.type === 'ENGAGEMENT' ? 'bg-red-500'
                  : evt.type === 'DESTRUCTION' ? 'bg-orange-600'
                  : 'bg-slate-500'
                }`} />
                <span className="text-slate-300 leading-relaxed">{evt.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
