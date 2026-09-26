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
 * - Formation footprint: scaled ▪ grid below the frame, communicates troop strength visually
 * - NO cyberpunk glow. NO neon colors. Restrained military palette.
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

  // ── Palette: Restrained military standard ──
  // Blue force: deep classic blue
  // Red force: muted brick red
  // All: dark outlines, off-white labels
  const frameStroke = isDestroyed
    ? '#707070'
    : isBlue
    ? '#1a4080'   // Deep blue – restrained
    : '#9a2020'   // Brick red – restrained

  const frameFill = isDestroyed
    ? '#d0ccc0'
    : isBlue
    ? '#dce8f8'   // Very pale blue tint – cartographic style
    : '#f5dcdc'   // Very pale red tint

  const glyphColor = isDestroyed
    ? '#888'
    : isBlue
    ? '#1a4080'
    : '#9a2020'

  const labelFill = isDestroyed ? '#888' : '#1a1a1a'

  // ── Unit tactical glyph (inside frame) ──
  const renderGlyph = () => {
    if (isDestroyed) {
      // Destroyed: large X
      return (
        <g stroke="#b03030" strokeWidth="2.5" strokeLinecap="round">
          <line x1="-9" y1="-7" x2="9" y2="7" />
          <line x1="9" y1="-7" x2="-9" y2="7" />
        </g>
      )
    }

    switch (entity.unitClass) {
      case 'INFANTRY':
        // Crossed diagonal lines (NATO infantry standard)
        return (
          <g stroke={glyphColor} strokeWidth="2" strokeLinecap="round">
            <line x1="-9" y1="-7" x2="9" y2="7" />
            <line x1="9" y1="-7" x2="-9" y2="7" />
          </g>
        )
      case 'ARMORED':
        // Oval track (NATO armor standard)
        return (
          <ellipse cx="0" cy="0" rx="9" ry="5.5" fill="none" stroke={glyphColor} strokeWidth="2" />
        )
      case 'MECHANIZED':
        // Oval + crossed diagonals (mech infantry)
        return (
          <g stroke={glyphColor} strokeWidth="1.8">
            <ellipse cx="0" cy="0" rx="9" ry="5.5" fill="none" />
            <line x1="-7" y1="-4" x2="7" y2="4" />
            <line x1="7" y1="-4" x2="-7" y2="4" />
          </g>
        )
      case 'ARTILLERY':
        // Solid dot (NATO artillery standard)
        return <circle cx="0" cy="0" r="4" fill={glyphColor} />
      case 'COMMAND':
        // CP flag glyph
        return (
          <g stroke={glyphColor} strokeWidth="1.8" fill="none">
            <line x1="-7" y1="7" x2="-7" y2="-8" strokeWidth="2" />
            <polygon points="-7,-8 5,-4 -7,0" fill={glyphColor} stroke="none" />
          </g>
        )
      case 'UAV':
        // Top-down drone silhouette: X-wing shape
        return (
          <g fill={glyphColor} transform={`rotate(${entity.heading || 0})`}>
            <ellipse cx="0" cy="0" rx="3" ry="7" />
            <ellipse cx="0" cy="0" rx="8" ry="2" />
            <circle cx="0" cy="0" r="2" fill={frameFill} stroke={glyphColor} strokeWidth="1.2" />
          </g>
        )
      case 'FIGHTER':
      case 'INTERCEPTOR':
        // Top-down jet silhouette
        return (
          <g fill={glyphColor} transform={`rotate(${entity.heading || 0})`}>
            {/* Fuselage */}
            <ellipse cx="0" cy="0" rx="2.5" ry="10" />
            {/* Delta wings */}
            <polygon points="0,-2 10,4 0,6 -10,4" />
            {/* Tail fins */}
            <polygon points="0,8 4,12 -4,12" />
          </g>
        )
      case 'HELICOPTER':
        // Top-down rotary silhouette
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

  // ── Formation footprint: grid of small ▪ squares scaled by elementCount ──
  // This communicates troop strength visually without requiring the user to read numbers
  const renderFormationFootprint = () => {
    if (isAir || isDestroyed || entity.strength.elementCount <= 1) return null

    const dots: React.ReactNode[] = []
    const n = entity.strength.elementCount
    const cols = Math.min(5, Math.ceil(Math.sqrt(n)))
    const rows = Math.ceil(n / cols)
    const spacing = 6.5
    const dotSize = 2.8

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        if (idx < n) {
          const ox = (c - (cols - 1) / 2) * spacing
          const oy = (r - (rows - 1) / 2) * spacing + 20
          dots.push(
            <rect
              key={idx}
              x={ox - dotSize / 2}
              y={oy - dotSize / 2}
              width={dotSize}
              height={dotSize}
              fill={isBlue ? '#2050a0' : '#a02020'}
              opacity={isDamaged ? 0.45 : 0.80}
              rx="0.5"
            />
          )
        }
      }
    }
    return <g className="formation-footprint">{dots}</g>
  }

  // ── Echelon size modifier (hash marks above frame) ──
  // More marks = larger unit
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

  // ── Strength bar under frame ──
  const renderStrengthBar = () => {
    if (isDestroyed) return null
    const pct = Math.max(0, Math.min(100, entity.strength.currentStrength))
    const totalW = 28
    const filledW = (pct / 100) * totalW
    const barY = isAir ? 20 : 14

    return (
      <g>
        {/* Background track */}
        <rect x={-totalW / 2} y={barY} width={totalW} height={3} fill="#d0c8b0" stroke="#9a8860" strokeWidth="0.5" rx="1.5" />
        {/* Filled portion */}
        <rect
          x={-totalW / 2}
          y={barY}
          width={filledW}
          height={3}
          fill={
            pct > 70 ? (isBlue ? '#2060c0' : '#c02020')
            : pct > 40 ? '#c08020'
            : '#c04040'
          }
          rx="1.5"
        />
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
      {/* ── Ground Force Zone Radius (dashed perimeter) ── */}
      {!isAir && !isDestroyed && (
        <circle
          cx="0"
          cy="0"
          r={entity.strength.footprintRadius}
          fill={isBlue ? 'rgba(20,60,160,0.05)' : 'rgba(160,20,20,0.05)'}
          stroke={isBlue ? '#1a4080' : '#9a2020'}
          strokeWidth="0.8"
          strokeDasharray="4 4"
          opacity={selected ? 0.75 : 0.30}
        />
      )}

      {/* ── Selection brackets (amber corner targets) ── */}
      {selected && (
        <g stroke="#c07820" strokeWidth="2" fill="none" opacity="0.9">
          <path d="M -20 -14 L -20 -20 L -14 -20" />
          <path d="M 14 -20 L 20 -20 L 20 -14" />
          <path d="M 20 14 L 20 20 L 14 20" />
          <path d="M -14 20 L -20 20 L -20 14" />
        </g>
      )}

      {/* ── Main tactical frame ── */}
      {isAir ? (
        // Air: diamond frame
        <polygon
          points="0,-17 18,0 0,17 -18,0"
          fill={frameFill}
          stroke={frameStroke}
          strokeWidth={selected ? 2.5 : 1.8}
        />
      ) : (
        // Ground: rectangular frame
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

      {/* ── Echelon size modifier (hash lines above frame) ── */}
      {renderEchelon()}

      {/* ── Inside tactical glyph ── */}
      {renderGlyph()}

      {/* ── Physical formation footprint (strength-scaled grid) ── */}
      {renderFormationFootprint()}

      {/* ── Strength bar ── */}
      {renderStrengthBar()}

      {/* ── Unit identification label (above frame) ── */}
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
          stroke: '#f0e8d8',
          strokeWidth: '2.5px',
          letterSpacing: '0.5px',
        }}
      >
        {entity.id}
      </text>

      {/* ── Altitude label for air units ── */}
      {isAir && entity.altitude && !isDestroyed && (
        <text
          x="0"
          y="27"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="7.5"
          fill="#3a3a3a"
          style={{ paintOrder: 'stroke', stroke: '#f0e8d8', strokeWidth: '2px' }}
        >
          {(entity.altitude / 1000).toFixed(1)}km
        </text>
      )}

      {/* ── Damage marker: amber ⚠ badge ── */}
      {isDamaged && !isDestroyed && (
        <g transform="translate(14, -14)">
          <polygon points="0,-6 5.2,3 -5.2,3" fill="#c08020" />
          <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">!</text>
        </g>
      )}

      {/* ── Destroyed X marker (large, centered) ── */}
      {isDestroyed && (
        <text
          x="28"
          y="-18"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8"
          fill="#a03030"
          style={{ paintOrder: 'stroke', stroke: '#f0e8d8', strokeWidth: '2px' }}
        >
          KIA
        </text>
      )}
    </g>
  )
}
