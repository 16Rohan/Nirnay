import React from 'react'
import type { TacticalEntity2D } from '../../types/tactical_arena_2d'

interface TacticalSymbolProps {
  entity: TacticalEntity2D
  selected: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
}

/**
 * Professional military symbol using NIRNAY visual language.
 * - Ground forces: rectangular tactical frame + NATO-derived glyph (APP-06 inspired)
 * - Air forces: diamond frame + aircraft top-down silhouette
 * - Visual troop strength visual footprint
 * - Restrained dark-mode military command palette (crisp contrast)
 */
export const TacticalMilitarySymbol: React.FC<TacticalSymbolProps> = ({
  entity,
  selected,
  onClick,
  onHover,
}) => {
  const isBlue = entity.faction === 'BLUE'
  const isDestroyed = entity.status === 'DESTROYED'
  const isDamaged = entity.status === 'DAMAGED'
  const isAir = entity.category === 'AIR'

  // ── Palette: High-contrast Dark Command Tactical ──
  // Blue force: Restrained friendly blue frame, deep tactical blue fill
  // Red force: Restrained hostile red frame, deep tactical red fill
  const frameStroke = isDestroyed
    ? '#64748b'
    : isBlue
    ? '#4a90e2'   // Restrained friendly blue
    : '#d32f2f'   // Restrained hostile red

  const frameFill = isDestroyed
    ? '#1e293b'
    : isBlue
    ? '#163a5f'   // Deep tactical blue fill
    : '#5c1616'   // Deep tactical red fill

  const glyphColor = isDestroyed
    ? '#64748b'
    : isBlue
    ? '#4a90e2'
    : '#d32f2f'

  const labelFill = isDestroyed ? '#64748b' : '#f8fafc'

  // ── Unit tactical glyph (inside frame) ──
  const renderGlyph = () => {
    if (isDestroyed) {
      return (
        <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
          <line x1="-9" y1="-7" x2="9" y2="7" />
          <line x1="9" y1="-7" x2="-9" y2="7" />
        </g>
      )
    }

    switch (entity.unitClass) {
      case 'INFANTRY':
        return (
          <g stroke={glyphColor} strokeWidth="2" strokeLinecap="round">
            <line x1="-9" y1="-7" x2="9" y2="7" />
            <line x1="9" y1="-7" x2="-9" y2="7" />
          </g>
        )
      case 'ARMORED':
        return (
          <ellipse cx="0" cy="0" rx="9" ry="5.5" fill="none" stroke={glyphColor} strokeWidth="2" />
        )
      case 'MECHANIZED':
        return (
          <g stroke={glyphColor} strokeWidth="1.8">
            <ellipse cx="0" cy="0" rx="9" ry="5.5" fill="none" />
            <line x1="-7" y1="-4" x2="7" y2="4" />
            <line x1="7" y1="-4" x2="-7" y2="4" />
          </g>
        )
      case 'ARTILLERY':
        return <circle cx="0" cy="0" r="4" fill={glyphColor} />
      case 'COMMAND':
        return (
          <g stroke={glyphColor} strokeWidth="1.8" fill="none">
            <line x1="-7" y1="7" x2="-7" y2="-8" strokeWidth="2" />
            <polygon points="-7,-8 5,-4 -7,0" fill={glyphColor} stroke="none" />
          </g>
        )
      case 'UAV':
        return (
          <g fill={glyphColor} transform={`rotate(${entity.heading || 0})`}>
            <ellipse cx="0" cy="0" rx="3" ry="7" />
            <ellipse cx="0" cy="0" rx="8" ry="2" />
            <circle cx="0" cy="0" r="2" fill={frameFill} stroke={glyphColor} strokeWidth="1.2" />
          </g>
        )
      case 'FIGHTER':
      case 'INTERCEPTOR':
        return (
          <g fill={glyphColor} transform={`rotate(${entity.heading || 0})`}>
            <ellipse cx="0" cy="0" rx="2.5" ry="10" />
            <polygon points="0,-2 10,4 0,6 -10,4" />
            <polygon points="0,8 4,12 -4,12" />
          </g>
        )
      case 'HELICOPTER':
        return (
          <g stroke={glyphColor} fill={glyphColor} transform={`rotate(${entity.heading || 0})`}>
            <circle cx="0" cy="0" r="3" />
            <line x1="-11" y1="0" x2="11" y2="0" strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="-2.5" x2="0" y2="8" strokeWidth="2" strokeLinecap="round" />
          </g>
        )
      default:
        return <circle cx="0" cy="0" r="4.5" fill={glyphColor} />
    }
  }

  // ── Formation Strength Blocks ──
  const renderStrengthBlocks = () => {
    if (isAir || isDestroyed || entity.strength.elementCount < 1) return null
    const n = Math.min(12, entity.strength.elementCount)
    const blockWidth = 4
    const blockHeight = 4.5
    const spacing = 1.2
    
    const cols = Math.min(6, n)
    const rows = Math.ceil(n / 6)
    
    const blocks: React.ReactNode[] = []
    
    for (let r = 0; r < rows; r++) {
      const rowCols = r === rows - 1 && n % 6 !== 0 ? n % 6 : 6
      const rowW = rowCols * blockWidth + (rowCols - 1) * spacing
      const startX = -rowW / 2
      const yPos = 13 + r * (blockHeight + spacing)
      
      for (let c = 0; c < rowCols; c++) {
        blocks.push(
          <rect
            key={`${r}-${c}`}
            x={startX + c * (blockWidth + spacing)}
            y={yPos}
            width={blockWidth}
            height={blockHeight}
            fill={isBlue ? '#4a90e2' : '#d32f2f'}
            opacity={isDamaged ? 0.5 : 0.95}
            stroke="#020617"
            strokeWidth="0.4"
          />
        )
      }
    }
    
    return <g className="formation-strength-blocks">{blocks}</g>
  }

  // ── Echelon size modifier ──
  const renderEchelon = () => {
    if (isAir || isDestroyed) return null
    const n = entity.strength.elementCount
    const marks = n >= 10 ? 3 : n >= 6 ? 2 : 1
    return (
      <g stroke={glyphColor} strokeWidth="1.5" strokeLinecap="round">
        {marks === 1 && <line x1="0" y1="-16" x2="0" y2="-13" />}
        {marks === 2 && (
          <>
            <line x1="-3" y1="-16" x2="-3" y2="-13" />
            <line x1="3" y1="-16" x2="3" y2="-13" />
          </>
        )}
        {marks === 3 && (
          <>
            <line x1="-5" y1="-16" x2="-5" y2="-13" />
            <line x1="0" y1="-16" x2="0" y2="-13" />
            <line x1="5" y1="-16" x2="5" y2="-13" />
          </>
        )}
      </g>
    )
  }

  return (
    <g
      transform={`translate(${entity.position.x}, ${entity.position.y})`}
      className="cursor-pointer"
      onClick={e => {
        e.stopPropagation()
        onClick?.()
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Ground Force Zone Radius */}
      {!isAir && !isDestroyed && (
        <circle
          cx="0"
          cy="0"
          r={entity.strength.footprintRadius}
          fill={isBlue ? 'rgba(74, 144, 226, 0.08)' : 'rgba(211, 47, 47, 0.08)'}
          stroke={isBlue ? '#4a90e2' : '#d32f2f'}
          strokeWidth="0.8"
          strokeDasharray="4 4"
          opacity={selected ? 0.85 : 0.4}
        />
      )}

      {/* Selection brackets */}
      {selected && (
        <g stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.95">
          <path d="M -20 -14 L -20 -20 L -14 -20" />
          <path d="M 14 -20 L 20 -20 L 20 -14" />
          <path d="M 20 14 L 20 20 L 14 20" />
          <path d="M -14 20 L -20 20 L -20 14" />
        </g>
      )}

      {/* Main tactical frame */}
      {isAir ? (
        <polygon
          points="0,-17 18,0 0,17 -18,0"
          fill={frameFill}
          stroke={frameStroke}
          strokeWidth={selected ? 2.5 : 1.8}
        />
      ) : (
        <rect
          x="-16"
          y="-12"
          width="32"
          height="24"
          rx="1.5"
          fill={frameFill}
          stroke={frameStroke}
          strokeWidth={selected ? 2.5 : 1.8}
        />
      )}

      {/* Echelon size modifier */}
      {renderEchelon()}

      {/* Inside glyph */}
      {renderGlyph()}

      {/* Strength blocks */}
      {renderStrengthBlocks()}

      {/* Unit ID label (crisp white text with dark outline halo) */}
      <text
        x="0"
        y="-20"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="9"
        fontWeight="700"
        fill={labelFill}
        style={{
          paintOrder: 'stroke',
          stroke: '#020617',
          strokeWidth: '3px',
          letterSpacing: '0.5px',
        }}
      >
        {entity.id}
      </text>

      {/* Altitude label for air */}
      {isAir && entity.altitude && !isDestroyed && (
        <text
          x="0"
          y="27"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="7.5"
          fill="#4a90e2"
          style={{ paintOrder: 'stroke', stroke: '#020617', strokeWidth: '2.5px' }}
        >
          {(entity.altitude / 1000).toFixed(1)}km
        </text>
      )}

      {/* Damage marker */}
      {isDamaged && !isDestroyed && (
        <g transform="translate(14, -14)">
          <polygon points="0,-6 5.2,3 -5.2,3" fill="#f59e0b" />
          <text x="0" y="2.5" textAnchor="middle" fill="#000000" fontSize="6" fontWeight="bold">!</text>
        </g>
      )}

      {/* Destroyed KIA marker */}
      {isDestroyed && (
        <text
          x="28"
          y="-18"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8"
          fill="#ef4444"
          style={{ paintOrder: 'stroke', stroke: '#020617', strokeWidth: '2.5px' }}
        >
          KIA
        </text>
      )}
    </g>
  )
}
