import React from 'react'
import type { TacticalObjective2D } from '../../types/tactical_arena_2d'

interface ObjectiveMarkerProps {
  objective: TacticalObjective2D
  selected: boolean
  onClick?: () => void
}

/**
 * Cartographic objective marker.
 * - Natural fill colors (not neon/glowing) that reflect the map palette
 * - State-differentiated: SECURED (olive green), CONTESTED (amber/red), UNSECURED (blue), FAILED (grey)
 * - Dashed perimeter zone circle
 * - Clean crosshair center glyph
 */
export const TacticalObjectiveMarker2D: React.FC<ObjectiveMarkerProps> = ({
  objective,
  selected,
  onClick,
}) => {
  const { x, y } = objective.position
  const isSecured = objective.state === 'SECURED'
  const isContested = objective.state === 'CONTESTED'
  const isFailed = objective.state === 'FAILED'
  const isMonitored = objective.state === 'MONITORED'

  // State-based color palette: all muted/natural, no neon
  const zoneStroke = isSecured
    ? '#2a6a30'    // Muted olive green
    : isContested
    ? '#b04010'    // Amber-red
    : isFailed
    ? '#6a6050'    // Muted grey-brown
    : isMonitored
    ? '#5a7aaa'    // Slate blue
    : '#2a5a8a'    // Blue-grey

  const zoneFill = isSecured
    ? 'rgba(40,100,40,0.10)'
    : isContested
    ? 'rgba(160,60,16,0.10)'
    : isFailed
    ? 'rgba(100,90,70,0.08)'
    : 'rgba(40,80,140,0.08)'

  const centerFill = isSecured
    ? '#2a6a30'
    : isContested
    ? '#b04010'
    : isFailed
    ? '#6a6050'
    : '#2a5a8a'

  const stateLabel = isSecured
    ? 'SECURED'
    : isContested
    ? 'CONTESTED'
    : isFailed
    ? 'FAILED'
    : isMonitored
    ? 'MONITORED'
    : 'UNSECURED'

  const stateLabelColor = isSecured
    ? '#1a5a20'
    : isContested
    ? '#903010'
    : isFailed
    ? '#505040'
    : '#1a4070'

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer select-none"
      onClick={e => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {/* Objective control zone perimeter */}
      <circle
        cx="0"
        cy="0"
        r={objective.radius}
        fill={zoneFill}
        stroke={zoneStroke}
        strokeWidth={selected ? 2 : 1.2}
        strokeDasharray="6 3"
        opacity="0.85"
      />

      {/* Selection highlight ring */}
      {selected && (
        <circle
          cx="0"
          cy="0"
          r={objective.radius + 5}
          fill="none"
          stroke="#c07820"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.7"
        />
      )}

      {/* Objective center glyph: bullseye crosshair */}
      {/* Outer ring */}
      <circle cx="0" cy="0" r="10" fill="#f0e8d8" stroke={zoneStroke} strokeWidth="1.8" />
      {/* Inner dot */}
      <circle cx="0" cy="0" r="3.5" fill={centerFill} />
      {/* Crosshair ticks */}
      <line x1="-14" y1="0" x2="-10" y2="0" stroke={zoneStroke} strokeWidth="1.5" />
      <line x1="10" y1="0" x2="14" y2="0" stroke={zoneStroke} strokeWidth="1.5" />
      <line x1="0" y1="-14" x2="0" y2="-10" stroke={zoneStroke} strokeWidth="1.5" />
      <line x1="0" y1="10" x2="0" y2="14" stroke={zoneStroke} strokeWidth="1.5" />

      {/* Objective name tag below zone */}
      <rect
        x={-(objective.name.length * 3.0 + 8)}
        y={objective.radius + 5}
        width={objective.name.length * 6.0 + 16}
        height="18"
        rx="2"
        fill="#f0e8d8"
        stroke={zoneStroke}
        strokeWidth="1"
        opacity="0.95"
      />
      <text
        x="0"
        y={objective.radius + 17}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="8.5"
        fontWeight="700"
        fill="#2a2010"
        letterSpacing="0.3"
      >
        {objective.name.length > 22 ? objective.name.substring(0, 22) + '…' : objective.name}
      </text>

      {/* State badge above zone */}
      <rect
        x={-(stateLabel.length * 3.2 + 4)}
        y={-objective.radius - 18}
        width={stateLabel.length * 6.4 + 8}
        height="14"
        rx="2"
        fill={isContested ? '#b04010' : isSecured ? '#2a6a30' : '#f0e8d8'}
        stroke={zoneStroke}
        strokeWidth="0.8"
        opacity="0.92"
      />
      <text
        x="0"
        y={-objective.radius - 7}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="8"
        fontWeight="700"
        fill={isContested || isSecured ? '#ffffff' : stateLabelColor}
        letterSpacing="0.5"
      >
        {stateLabel}
      </text>
    </g>
  )
}
