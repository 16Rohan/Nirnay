import React, { useMemo } from 'react'
import type {
  TacticalEntity2D,
  TacticalObjective2D,
  TacticalEvent2D,
  ArenaViewMode,
  ArenaViewport,
  TerrainMapConfiguration,
} from '../../types/tactical_arena_2d'
import { TacticalTerrainMap } from './TacticalTerrainMap'
import { TacticalMilitarySymbol } from './TacticalMilitarySymbol'
import { TacticalObjectiveMarker2D } from './TacticalObjectiveMarker2D'
import { TacticalEventOverlay } from './TacticalEventOverlay'

interface TacticalArena2DProps {
  mapConfig: TerrainMapConfiguration
  entities: TacticalEntity2D[]
  objectives: TacticalObjective2D[]
  events: TacticalEvent2D[]
  viewMode: ArenaViewMode
  selectedId: string | null
  onSelectEntity: (id: string | null) => void
  onSelectObjective?: (id: string | null) => void
  onSelectEvent?: (event: TacticalEvent2D) => void
  onHoverEntity?: (entity: TacticalEntity2D | null) => void
  layers: {
    terrain: boolean
    grid: boolean
    contours: boolean
    routes: boolean
    objectives: boolean
    units: boolean
    events: boolean
  }
}

// Three predefined fixed viewports – no free camera
export const ARENA_VIEWPORTS: Record<ArenaViewMode, ArenaViewport> = {
  // Full theater view
  STRATEGIC: { x: 0, y: 0, width: 1200, height: 800 },
  // Operational sector focus: central corridor and river bridges
  OPERATIONAL: { x: 120, y: 170, width: 920, height: 610 },
  // Engagement focal zone
  EVENT: { x: 300, y: 220, width: 580, height: 390 },
}

export const TacticalArena2D: React.FC<TacticalArena2DProps> = ({
  mapConfig,
  entities,
  objectives,
  events,
  viewMode,
  selectedId,
  onSelectEntity,
  onSelectObjective,
  onSelectEvent,
  onHoverEntity,
  layers,
}) => {
  const currentViewport = useMemo(() => {
    // If entity selected in EVENT view, center around it
    if (viewMode === 'EVENT' && selectedId) {
      const sel = entities.find(e => e.id === selectedId)
      if (sel) {
        return {
          x: Math.max(0, Math.min(mapConfig.width - 580, sel.position.x - 290)),
          y: Math.max(0, Math.min(mapConfig.height - 390, sel.position.y - 195)),
          width: 580,
          height: 390,
        }
      }
    }
    return ARENA_VIEWPORTS[viewMode] || ARENA_VIEWPORTS.STRATEGIC
  }, [viewMode, selectedId, entities, mapConfig])

  const viewBox = `${currentViewport.x} ${currentViewport.y} ${currentViewport.width} ${currentViewport.height}`

  return (
    <div
      className="w-full h-full relative select-none overflow-hidden bg-[#1a1917] flex items-center justify-center"
      style={{ perspective: '2000px' }}
    >
      <div
        className="w-[130%] h-[130%] transition-transform duration-1000 ease-in-out"
        style={{
          transform: 'rotateX(55deg) rotateZ(-35deg) scale(0.95)',
          transformStyle: 'preserve-3d',
          background: 'transparent',
        }}
      >
      {/* Map frame: subtle fade replaced the hard border */}

      <svg
        viewBox={viewBox}
        className="w-full h-full transition-all duration-700 ease-in-out"
        style={{ shapeRendering: 'geometricPrecision' }}
        onClick={() => {
          onSelectEntity(null)
          onSelectObjective?.(null)
        }}
      >
        {/* ── Layer 1–5: Terrain, Contours, Water, Roads, Infrastructure ── */}
        {layers.terrain && (
          <TacticalTerrainMap
            mapConfig={mapConfig}
            showContours={layers.contours}
            showGrid={layers.grid}
          />
        )}

        {/* ── Layer 6: Tactical Routes / Movement Vectors ── */}
        {layers.routes && (
          <g className="tactical-routes-layer">
            {entities
              .filter(e => e.route.length > 1 && e.status !== 'DESTROYED')
              .map(entity => {
                const isBlue = entity.faction === 'BLUE'
                // High contrast dark tactical route colors: restrained blue for blue, restrained red for red
                const lineColor = isBlue ? '#4a90e2' : '#d32f2f'
                const pathD = entity.route.reduce((acc, curr, idx) => {
                  return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
                }, '')

                return (
                  <g key={`route-${entity.id}`}>
                    {/* Segmented Route lines */}
                    {entity.route.slice(0, -1).map((pt, i) => {
                      const nextPt = entity.route[i + 1]
                      const isActual = i === 0
                      const isPlanned = i === 1
                      const strokeDash = isActual ? 'none' : isPlanned ? '8 5' : '2 4'
                      const segmentOpacity = isActual ? 0.95 : isPlanned ? 0.80 : 0.55

                      return (
                        <g key={`seg-${i}`}>
                          <line
                            x1={pt.x}
                            y1={pt.y}
                            x2={nextPt.x}
                            y2={nextPt.y}
                            stroke={lineColor}
                            strokeWidth="2"
                            strokeDasharray={strokeDash}
                            strokeLinecap="round"
                            opacity={segmentOpacity}
                          />
                          {/* Arrow on last segment */}
                          {i === entity.route.length - 2 && (
                            <g
                              transform={`translate(${nextPt.x}, ${nextPt.y}) rotate(${
                                Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI)
                              })`}
                            >
                              <polygon points="8,0 -4,-4 -4,4" fill={lineColor} opacity="0.9" />
                            </g>
                          )}
                        </g>
                      )
                    })}
                    {/* Waypoint dots */}
                    {entity.route.slice(0, -1).map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={2}
                        fill={lineColor}
                        opacity="0.8"
                      />
                    ))}
                  </g>
                )
              })}
          </g>
        )}

        {/* ── Layer 7: Tactical Objectives ── */}
        {layers.objectives && (
          <g className="tactical-objectives-layer">
            {objectives.map(obj => (
              <TacticalObjectiveMarker2D
                key={obj.id}
                objective={obj}
                selected={selectedId === obj.id}
                onClick={() => onSelectObjective?.(obj.id)}
              />
            ))}
          </g>
        )}

        {/* ── Layer 8: Force Units ── */}
        {layers.units && (
          <g className="tactical-units-layer">
            {entities.map(entity => (
              <TacticalMilitarySymbol
                key={entity.id}
                entity={entity}
                selected={selectedId === entity.id}
                onClick={() => onSelectEntity(entity.id)}
                onHover={hovered => onHoverEntity?.(hovered ? entity : null)}
              />
            ))}
          </g>
        )}

        {/* ── Layer 9: Event Overlays ── */}
        {layers.events && (
          <TacticalEventOverlay events={events} onSelectEvent={onSelectEvent} />
        )}

        {/* ── Cartographic North Arrow ── */}
        <g transform="translate(52, 52)" className="select-none pointer-events-none">
          {/* Background circle */}
          <circle cx="0" cy="0" r="22" fill="#2a2722" stroke="#4a443e" strokeWidth="1.5" opacity="0.95" />
          {/* North pointer (red) */}
          <polygon points="0,-16 4,2 0,-2 -4,2" fill="#d32f2f" />
          {/* South pointer (slate) */}
          <polygon points="0,16 4,0 0,2 -4,0" fill="#57534e" stroke="#4a443e" strokeWidth="0.8" />
          {/* Centre dot */}
          <circle cx="0" cy="0" r="2.5" fill="#a8a29e" />
          {/* N label */}
          <text x="0" y="-23" textAnchor="middle" fill="#a8a29e"
            fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="700">N</text>
        </g>

        {/* ── Map Scale Bar ── */}
        <g transform={`translate(${mapConfig.width - 140}, ${mapConfig.height - 38})`}
          className="select-none pointer-events-none">
          <rect x="-4" y="-10" width="130" height="24" rx="2"
            fill="#2a2722" stroke="#4a443e" strokeWidth="1" opacity="0.9" />
          {/* Scale line */}
          <line x1="4" y1="0" x2="120" y2="0" stroke="#78716c" strokeWidth="1.5" />
          <line x1="4" y1="-4" x2="4" y2="4" stroke="#78716c" strokeWidth="1.5" />
          <line x1="62" y1="-3" x2="62" y2="3" stroke="#78716c" strokeWidth="1" />
          <line x1="120" y1="-4" x2="120" y2="4" stroke="#78716c" strokeWidth="1.5" />
          {/* Alternating blocks */}
          <rect x="4" y="-3" width="29" height="6" fill="#78716c" />
          <rect x="62" y="-3" width="29" height="6" fill="#78716c" />
          {/* Labels */}
          <text x="4" y="12" textAnchor="middle" fill="#d6d3d1"
            fontFamily="'JetBrains Mono', monospace" fontSize="7">0</text>
          <text x="62" y="12" textAnchor="middle" fill="#d6d3d1"
            fontFamily="'JetBrains Mono', monospace" fontSize="7">10km</text>
          <text x="120" y="12" textAnchor="middle" fill="#d6d3d1"
            fontFamily="'JetBrains Mono', monospace" fontSize="7">20km</text>
        </g>

        {/* ── Map ID stamp ── */}
        <text
          x={mapConfig.width - 8}
          y={mapConfig.height - 12}
          textAnchor="end"
          fill="#78716c"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8"
          opacity="0.65"
        >
          {mapConfig.id} · NIRNAY TACTICAL SIM
        </text>
      </svg>
      </div>
    </div>
  )
}
