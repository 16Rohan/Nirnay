import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Crosshair,
  ArrowLeft,
  ChevronDown,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Code2,
  FileText,
  Activity,
  Compass,
  Zap,
  MapPin,
  HelpCircle,
  Eye,
} from 'lucide-react'
import { useWargameStore } from '../store/wargameStore'
import { TacticalArena2D } from '../components/tactical_arena_2d/TacticalArena2D'
import { SYNTHETIC_BATTLEFIELD_MAP } from '../components/tactical_arena_2d/TerrainMapConfig'
import { mapSimulationToTacticalArena2D } from '../adapters/tacticalArena2dAdapter'
import { TacticalInspector } from '../components/tactical_arena_2d/TacticalInspector'
import type { ArenaViewMode, TacticalEntity2D, TacticalObjective2D, TacticalEvent2D } from '../types/tactical_arena_2d'

export default function Simulation() {
  const { currentTurnResult, turnHistory, activeSessionId } = useWargameStore()

  // Predefined fixed viewpoints: STRATEGIC (Full), OPERATIONAL (Sector), EVENT (Engagement)
  const [viewMode, setViewMode] = useState<ArenaViewMode>('STRATEGIC')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null)
  const [hoveredEntity, setHoveredEntity] = useState<TacticalEntity2D | null>(null)

  // Map layer controls
  const [layers, setLayers] = useState({
    terrain: true,
    grid: true,
    contours: true,
    routes: true,
    objectives: true,
    units: true,
    events: true,
  })

  // Synchronized simulation state from authoritative backend TurnResult
  const arenaData = useMemo(() => {
    return mapSimulationToTacticalArena2D(currentTurnResult)
  }, [currentTurnResult])

  const selectedEntity = useMemo(() => {
    return arenaData.entities.find(e => e.id === selectedEntityId) || null
  }, [arenaData.entities, selectedEntityId])

  const selectedObjective = useMemo(() => {
    return arenaData.objectives.find(o => o.id === selectedObjectiveId) || null
  }, [arenaData.objectives, selectedObjectiveId])

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleEventClick = (evt: TacticalEvent2D) => {
    if (evt.sourceEntityId) {
      setSelectedEntityId(evt.sourceEntityId)
    }
    setViewMode('EVENT')
  }

  return (
    <div className="min-h-screen bg-[#02070D] text-white flex flex-col">
      {/* Top Tactical Command Header */}
      <header className="h-16 px-6 bg-[rgba(6,17,28,0.95)] border-b border-slate-800 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            to="/wargaming"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO WARGAME CONSOLE</span>
          </Link>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#42C7FF] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#42D99A] animate-pulse" />
              <span>NIRNAY 2D TACTICAL ARENA · {SYNTHETIC_BATTLEFIELD_MAP.name}</span>
            </div>
            <h1 className="text-base font-display font-bold text-white tracking-wide">
              {activeSessionId ? `CAMPAIGN: ${activeSessionId}` : 'SYNTHETIC SECTOR H-04 BATTLE-TRACKER'}
            </h1>
          </div>
        </div>

        {/* Viewpoint Controls (STRATEGIC / OPERATIONAL / EVENT) */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['STRATEGIC', 'OPERATIONAL', 'EVENT'] as ArenaViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1 rounded-lg font-mono text-xs font-bold uppercase transition-all ${
                viewMode === mode
                  ? 'bg-[#168CFF] text-white shadow-[0_0_12px_rgba(22,140,255,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {mode} VIEW
            </button>
          ))}
        </div>
      </header>

      {/* Main Dual Presentation Workspace: 2D Tactical Map + Synchronized Textual Simulation */}
      <div className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        {/* Left / Center 8 Columns: 2D Synthetic Battlefield Canvas */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Map Container */}
          <div className="relative w-full h-[580px] lg:h-[660px]">
            <TacticalArena2D
              mapConfig={SYNTHETIC_BATTLEFIELD_MAP}
              entities={arenaData.entities}
              objectives={arenaData.objectives}
              events={arenaData.events}
              viewMode={viewMode}
              selectedId={selectedEntityId || selectedObjectiveId}
              onSelectEntity={id => {
                setSelectedEntityId(id)
                setSelectedObjectiveId(null)
              }}
              onSelectObjective={id => {
                setSelectedObjectiveId(id)
                setSelectedEntityId(null)
              }}
              onSelectEvent={handleEventClick}
              onHoverEntity={setHoveredEntity}
              layers={layers}
            />

            {/* Quick Map Layers Pill Dropdown */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-[rgba(6,17,28,0.9)] backdrop-blur-md p-1.5 rounded-xl border border-slate-800 font-mono text-[10px]">
              {(['terrain', 'grid', 'routes', 'objectives', 'units', 'events'] as Array<keyof typeof layers>).map(
                layerKey => (
                  <button
                    key={layerKey}
                    onClick={() => toggleLayer(layerKey)}
                    className={`px-2 py-1 rounded capitalize transition-all ${
                      layers[layerKey]
                        ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {layerKey}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Bottom Synchronized Textual Adjudication Summary (PRD-08 Non-Negotiable) */}
          <div className="bg-[rgba(6,17,28,0.95)] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#42C7FF]" />
                <h3 className="font-display font-bold text-white text-sm">
                  SYNCHRONIZED TEXTUAL SIMULATION ADJUDICATION
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                TURN {currentTurnResult?.turn_number || arenaData.turnNumber} OUTCOMES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Blue Strategic Decision */}
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-blue-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> BLUE COA:{' '}
                    {currentTurnResult?.decisions.blue_coa_name || 'Forward Interdiction Corridor'}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {currentTurnResult?.decisions.blue_intent ||
                    'Secure Logistics Hub Alpha and advance 1st Mech Battalion to contest river crossing bridge.'}
                </p>
              </div>

              {/* Red Reaction / Counter-Intent */}
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-red-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" /> RED OPERATIONAL REACTION
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {currentTurnResult?.decisions.red_intent ||
                    'Shock armor elements massing along eastern defile to screen high-speed transit.'}
                </p>
              </div>
            </div>

            {/* Strategic Evaluation */}
            {currentTurnResult?.evaluation && (
              <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-500/20 font-mono text-[11px] text-slate-300 space-y-1">
                <span className="text-emerald-400 font-bold block">STRATEGIC EVALUATION:</span>
                <p>{currentTurnResult.evaluation.strategic_conclusion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: Inspector, ORBAT, and Event Log */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <TacticalInspector
            selectedEntity={selectedEntity}
            selectedObjective={selectedObjective}
            hoveredEntity={hoveredEntity}
            allEntities={arenaData.entities}
            events={arenaData.events}
            onSelectEntity={setSelectedEntityId}
            onClose={() => {
              setSelectedEntityId(null)
              setSelectedObjectiveId(null)
            }}
          />

          {/* Tactical Event Stream Log */}
          <div className="bg-[rgba(6,17,28,0.95)] border border-slate-800 rounded-xl p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                ADJUDICATED EVENT STREAM
              </span>
              <span className="font-mono text-[10px] text-slate-500">{arenaData.events.length} EVENTS</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[300px] font-mono text-xs pr-1">
              {arenaData.events.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  onClick={() => handleEventClick(evt)}
                  className="p-2.5 rounded bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold ${
                        evt.type === 'ENGAGEMENT'
                          ? 'text-red-400'
                          : evt.type === 'DESTRUCTION'
                          ? 'text-red-500'
                          : 'text-blue-400'
                      }`}
                    >
                      {evt.type}
                    </span>
                    <span className="text-slate-500">{evt.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-tight">{evt.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
