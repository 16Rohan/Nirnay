import React from 'react'
import type { TacticalEvent2D } from '../../types/tactical_arena_2d'

interface TacticalEventOverlayProps {
  events: TacticalEvent2D[]
  onSelectEvent?: (event: TacticalEvent2D) => void
}

/**
 * Event overlay with map-like restrained visual language.
 * - ENGAGEMENT: compact two-circle target reticle, warm red
 * - DESTRUCTION: clean ✕ burned-out marker with wreckage indicator
 * - DETECTION: small diamond marker
 * - Tag: parchment-colored label, no neon
 */
export const TacticalEventOverlay: React.FC<TacticalEventOverlayProps> = ({
  events,
  onSelectEvent,
}) => {
  return (
    <g className="tactical-events-layer">
      {events.map((evt, idx) => {
        const isEngagement = evt.type === 'ENGAGEMENT'
        const isDestruction = evt.type === 'DESTRUCTION'
        const isDetection = evt.type === 'DETECTION'

        return (
          <g
            key={evt.id || idx}
            transform={`translate(${evt.position.x}, ${evt.position.y})`}
            className="cursor-pointer"
            onClick={() => onSelectEvent?.(evt)}
          >
            {/* ── ENGAGEMENT: target reticle ── */}
            {isEngagement && (
              <g>
                <circle cx="0" cy="0" r="18" fill="rgba(160,40,16,0.12)"
                  stroke="#a03010" strokeWidth="1.5" strokeDasharray="5 3" />
                <circle cx="0" cy="0" r="9" fill="rgba(180,50,20,0.15)"
                  stroke="#c04020" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#c04020" />
                {/* Crosshair lines */}
                <line x1="-22" y1="0" x2="-10" y2="0" stroke="#a03010" strokeWidth="1.2" />
                <line x1="10" y1="0" x2="22" y2="0" stroke="#a03010" strokeWidth="1.2" />
                <line x1="0" y1="-22" x2="0" y2="-10" stroke="#a03010" strokeWidth="1.2" />
                <line x1="0" y1="10" x2="0" y2="22" stroke="#a03010" strokeWidth="1.2" />
              </g>
            )}

            {/* ── DESTRUCTION: burned-out marker ── */}
            {isDestruction && (
              <g>
                <circle cx="0" cy="0" r="12" fill="rgba(60,40,30,0.18)" stroke="#704030" strokeWidth="1.5" />
                <line x1="-9" y1="-9" x2="9" y2="9" stroke="#804030" strokeWidth="3" strokeLinecap="round" />
                <line x1="9" y1="-9" x2="-9" y2="9" stroke="#804030" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {/* ── DETECTION: diamond marker ── */}
            {isDetection && (
              <g>
                <polygon points="0,-12 9,0 0,12 -9,0"
                  fill="rgba(80,100,140,0.15)" stroke="#506090" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3" fill="#506090" />
              </g>
            )}

            {/* ── Event info tag ── */}
            <g style={{ transform: 'rotateZ(35deg) rotateX(-55deg)', transformOrigin: '0 0' }}>
              <g transform="translate(16, -20)">
                <rect x="0" y="0" width="120" height="18" rx="2"
                  fill="#ede5cc" stroke={isEngagement ? '#a03010' : isDestruction ? '#704030' : '#506090'}
                  strokeWidth="1" opacity="0.95" />
                <text x="6" y="12"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="8" fontWeight="600"
                  fill={isEngagement ? '#8a2010' : isDestruction ? '#604020' : '#405080'}
                >
                  {evt.timestamp} · {evt.type}
                </text>
              </g>
            </g>
          </g>
        )
      })}
    </g>
  )
}
