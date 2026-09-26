import React from 'react'
import type { TacticalObjective2D } from '../../types/tactical_arena_2d'

interface ObjectiveMarkerProps {
  objective: TacticalObjective2D
  selected: boolean
  onClick?: () => void
}

/**
 * Cartographic objective marker for dark command map.
 * - State-differentiated: SECURED (emerald green), CONTESTED (crimson red), UNSECURED (cyan blue), FAILED (slate)
 * - High-contrast text labels with dark outline halos
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

  const zoneStroke = isSecured
    ? '#2e7d32'    // Restrained green
    : isContested
    ? '#d32f2f'    // Restrained red
    : isFailed
    ? '#64748b'    // Slate grey
    : isMonitored
    ? '#4a90e2'    // Restrained blue
    : '#3173a1'    // Muted blue

  const zoneFill = isSecured
    ? 'rgba(46,125,50,0.12)'
    : isContested
    ? 'rgba(211,47,47,0.12)'
    : isFailed
    ? 'rgba(100,116,139,0.10)'
    : 'rgba(74,144,226,0.10)'

  const centerFill = isSecured
    ? '#2e7d32'
    : isContested
    ? '#d32f2f'
    : isFailed
    ? '#64748b'
    : '#3173a1'

  const stateLabel = isSecured
    ? 'SECURED'
    : isContested
    ? 'CONTESTED'
    : isFailed
    ? 'FAILED'
    : isMonitored
    ? 'MONITORED'
    : 'UNSECURED'

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
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.85"
        />
      )}

      {/* Objective center glyph: bullseye crosshair */}
      <circle cx="0" cy="0" r="8" fill="#0f172a" stroke={zoneStroke} strokeWidth="1.8" />
      <circle cx="0" cy="0" r="3" fill={centerFill} />
      {/* Crosshair ticks */}
      <line x1="-12" y1="0" x2="-8" y2="0" stroke={zoneStroke} strokeWidth="1.5" />
      <line x1="8" y1="0" x2="12" y2="0" stroke={zoneStroke} strokeWidth="1.5" />
      <line x1="0" y1="-12" x2="0" y2="-8" stroke={zoneStroke} strokeWidth="1.5" />
      <line x1="0" y1="8" x2="0" y2="12" stroke={zoneStroke} strokeWidth="1.5" />

      {/* State badge directly above */}
      <rect
        x={-(stateLabel.length * 2.8 + 4)}
        y="-24"
        width={stateLabel.length * 5.6 + 8}
        height="10"
        rx="2"
        fill={zoneStroke}
        opacity="0.9"
      />
      <text
        x="0"
        y="-16"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="7"
        fontWeight="700"
        fill="#ffffff"
        letterSpacing="0.5"
      >
        {stateLabel}
      </text>

      {/* Objective name below */}
      <text
        x="0"
        y="20"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="9"
        fontWeight="700"
        fill="#f8fafc"
        letterSpacing="0.3"
        style={{
          paintOrder: 'stroke',
          stroke: '#020617',
          strokeWidth: '3px',
        }}
      >
        {objective.name.length > 22 ? objective.name.substring(0, 22) + '…' : objective.name}
      </text>
    </g>
  )
}
