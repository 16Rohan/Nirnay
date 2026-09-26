import React from 'react'
import type { TerrainMapConfiguration } from '../../types/tactical_arena_2d'

interface TacticalTerrainMapProps {
  mapConfig: TerrainMapConfiguration
  showContours?: boolean
  showGrid?: boolean
}

export const TacticalTerrainMap: React.FC<TacticalTerrainMapProps> = ({
  mapConfig,
  showContours = true,
  showGrid = true,
}) => {
  return (
    <g className="tactical-terrain-layer">
      {/* ── Defs: Patterns, Textures, Gradients, Filters ── */}
      <defs>
        {/* Map tactical base – muted natural dark earth */}
        <linearGradient id="mapBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2e2d27" />
          <stop offset="50%" stopColor="#25241f" />
          <stop offset="100%" stopColor="#1c1b17" />
        </linearGradient>

        {/* Mountain hill-shade gradient – subtle depth shading */}
        <linearGradient id="mountainShade" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </linearGradient>

        {/* Forest canopy texture – dark tactical stipple */}
        <pattern id="forestPattern" width="14" height="14" patternUnits="userSpaceOnUse">
          <ellipse cx="4" cy="4" rx="3" ry="2.5" fill="#142118" opacity="0.65" />
          <ellipse cx="10" cy="10" rx="3" ry="2.5" fill="#142118" opacity="0.65" />
          <circle cx="10" cy="3" r="1.5" fill="#203627" opacity="0.5" />
          <circle cx="3" cy="11" r="1.5" fill="#203627" opacity="0.5" />
        </pattern>

        {/* Wetland marsh reeds pattern – natural muted teal */}
        <pattern id="wetlandPattern" width="18" height="18" patternUnits="userSpaceOnUse">
          <line x1="2" y1="9" x2="6" y2="9" stroke="#1d4543" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <line x1="4" y1="5" x2="4" y2="9" stroke="#1d4543" strokeWidth="1" opacity="0.6" />
          <line x1="11" y1="15" x2="15" y2="15" stroke="#1d4543" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <line x1="13" y1="11" x2="13" y2="15" stroke="#1d4543" strokeWidth="1" opacity="0.6" />
        </pattern>

        {/* Mountain rock texture – subtle brown-grey hatch */}
        <pattern id="mountainPattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="10" y2="0" stroke="#70685e" strokeWidth="0.75" opacity="0.15" />
        </pattern>

        {/* Subtle UTM/MGRS grid – restrained grey */}
        <pattern id="utmGrid" width={mapConfig.gridSize} height={mapConfig.gridSize} patternUnits="userSpaceOnUse">
          <path
            d={`M ${mapConfig.gridSize} 0 L 0 0 0 ${mapConfig.gridSize}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="0.75"
          />
        </pattern>

        {/* Dark edge vignette (fades soft map edges to dark background) */}
        <radialGradient id="borderDarkVignette" cx="50%" cy="50%" r="70%">
          <stop offset="70%" stopColor="#1a1917" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a1917" stopOpacity="0.85" />
        </radialGradient>

        {/* Drop shadow for infrastructure elements */}
        <filter id="shadowSm" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ── Layer 0: Map Base ── */}
      <rect
        x="0"
        y="0"
        width={mapConfig.width}
        height={mapConfig.height}
        fill="url(#mapBaseGrad)"
      />
      
      {/* ── Operational Boundary (Dashed Restrained Gray Line) ── */}
      <rect
        x="50"
        y="50"
        width={mapConfig.width - 100}
        height={mapConfig.height - 100}
        fill="none"
        stroke="#78716c"
        strokeWidth="1.5"
        strokeDasharray="10 6"
        opacity="0.35"
      />
      
      {/* Operational Area Header Label */}
      <text x={mapConfig.width / 2} y="40" textAnchor="middle" fill="#78716c" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" opacity="0.8" letterSpacing="4">
        EASTERN VALLEY OPERATIONAL SECTOR • GRID H-04
      </text>

      {/* ── Layer 1: Terrain Regions ── */}
      {mapConfig.regions.map(region => {
        const points = region.polygon.map(p => `${p[0]},${p[1]}`).join(' ')
        const isMountain = region.type === 'MOUNTAIN'
        const isForest = region.type === 'FOREST'
        const isWetland = region.type === 'WETLAND'

        return (
          <g key={region.id}>
            {/* Base fill */}
            <polygon points={points} fill={region.fill} />
            {/* Overlay texture */}
            {isMountain && <polygon points={points} fill="url(#mountainPattern)" />}
            {isMountain && <polygon points={points} fill="url(#mountainShade)" />}
            {isForest && <polygon points={points} fill="url(#forestPattern)" />}
            {isWetland && <polygon points={points} fill="url(#wetlandPattern)" />}
            {/* Region boundary outline */}
            <polygon points={points} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
          </g>
        )
      })}

      {/* ── Layer 2: Elevation Contour Lines ── */}
      {showContours &&
        mapConfig.contours.map((contour, i) => {
          const pathD = contour.path.reduce((acc, curr, idx) => {
            return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`
          }, '')
          const isIndex = i === 0
          return (
            <g key={`contour-${i}`}>
              <path
                d={pathD}
                fill="none"
                stroke="#57534e"
                strokeWidth={isIndex ? 1.5 : 0.8}
                opacity={isIndex ? 0.45 : 0.25}
              />
              {/* Elevation label */}
              {isIndex && contour.path[2] && (
                <text
                  x={contour.path[2][0] + 3}
                  y={contour.path[2][1] - 3}
                  fill="#78716c"
                  fontSize="8"
                  fontFamily="'JetBrains Mono', monospace"
                  opacity="0.75"
                  transform={`rotate(-8, ${contour.path[2][0]}, ${contour.path[2][1]})`}
                >
                  {contour.elevation}
                </text>
              )}
            </g>
          )
        })}

      {/* ── Layer 3: Waterways ── */}
      {mapConfig.water.map(w => {
        const pathD = w.path.reduce((acc, curr, idx) => {
          return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`
        }, '')
        return (
          <g key={w.id}>
            {/* Outer river bed / shore glow */}
            <path
              d={pathD}
              fill="none"
              stroke="#133045"
              strokeWidth={w.width + 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Main water body */}
            <path
              d={pathD}
              fill="none"
              stroke="#1e4a6d"
              strokeWidth={w.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
            {/* Flow line */}
            <path
              d={pathD}
              fill="none"
              stroke="#2e6d9e"
              strokeWidth={w.width * 0.2}
              strokeDasharray="18 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
          </g>
        )
      })}

      {/* ── Layer 4: Road Network (Dirt/Tan Routes) ── */}
      {mapConfig.roads.map(r => {
        const pathD = r.path.reduce((acc, curr, idx) => {
          return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`
        }, '')
        const isHighway = r.width >= 10
        return (
          <g key={r.id}>
            {/* Casing */}
            <path
              d={pathD}
              fill="none"
              stroke="#3a2b22"
              strokeWidth={r.width + 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* Paved road */}
            <path
              d={pathD}
              fill="none"
              stroke="#594838"
              strokeWidth={r.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center stripe */}
            {isHighway && (
              <path
                d={pathD}
                fill="none"
                stroke="#8c7760"
                strokeWidth="1.2"
                strokeDasharray="10 6"
                strokeLinecap="round"
              />
            )}
          </g>
        )
      })}

      {/* ── Layer 5: Tactical Infrastructure ── */}
      {mapConfig.infrastructure.map(inf => {
        if (!inf.position) return null
        const [x, y] = inf.position
        const [w, h] = inf.size || [30, 20]

        if (inf.type === 'BRIDGE') {
          return (
            <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
              {/* Bridge deck */}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#2e2b26" stroke="#47413b" strokeWidth="1.5" rx="1" />
              {/* Guardrails */}
              <line x1={-w / 2} y1={-h / 2 + 2} x2={w / 2} y2={-h / 2 + 2} stroke="#47413b" strokeWidth="1" />
              <line x1={-w / 2} y1={h / 2 - 2} x2={w / 2} y2={h / 2 - 2} stroke="#47413b" strokeWidth="1" />
              {/* Center marking */}
              <line x1={-w / 2 + 4} y1="0" x2={w / 2 - 4} y2="0" stroke="#786c5f" strokeWidth="1" strokeDasharray="4 3" />
              {/* Label */}
              <text x="0" y={h / 2 + 11} textAnchor="middle" fill="#a8a29e" fontSize="8"
                fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                {inf.name.split('(')[0].trim()}
              </text>
            </g>
          )
        }

        if (inf.type === 'AIRFIELD') {
          return (
            <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
              {/* Apron */}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#272521" stroke="#3c3832" strokeWidth="1.5" rx="2" />
              {/* Runway */}
              <rect x={-w / 2 + 4} y={-4} width={w - 8} height={8} fill="#1a1815" stroke="#4a443e" strokeWidth="0.8" />
              {/* Threshold markings */}
              <line x1={-w / 2 + 8} y1="0" x2={w / 2 - 8} y2="0" stroke="#78716c" strokeWidth="1.5" strokeDasharray="8 5" />
              <line x1={-w / 2 + 8} y1="-3" x2={-w / 2 + 8} y2="3" stroke="#78716c" strokeWidth="1.5" />
              <line x1={w / 2 - 8} y1="-3" x2={w / 2 - 8} y2="3" stroke="#78716c" strokeWidth="1.5" />
              <text x="0" y={-h / 2 - 4} textAnchor="middle" fill="#a8a29e" fontSize="9">✈</text>
              <text x="0" y={h / 2 + 12} textAnchor="middle" fill="#a8a29e" fontSize="7.5"
                fontFamily="'JetBrains Mono', monospace" fontWeight="700" letterSpacing="0.5">
                AIRFIELD
              </text>
            </g>
          )
        }

        if (inf.type === 'LOGISTICS_DEPOT') {
          return (
            <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
              <rect x={-w / 2} y={-h / 2} width={w} height={h}
                fill="#272521" fillOpacity="0.8"
                stroke="#57534e" strokeWidth="1.5" strokeDasharray="5 2" />
              <rect x={-w / 2 + 4} y={-h / 2 + 4} width={w / 3 - 2} height={h * 0.55} fill="#1a1815" stroke="#3c3832" strokeWidth="1" />
              <rect x={-w / 2 + w / 3 + 4} y={-h / 2 + 4} width={w / 3 - 2} height={h * 0.55} fill="#1a1815" stroke="#3c3832" strokeWidth="1" />
              <rect x={-6} y={-6} width={12} height={12} fill="#3c3832" stroke="#78716c" strokeWidth="1" rx="1" />
              <text x="0" y="4" textAnchor="middle" fill="#d6d3d1" fontSize="9" fontWeight="bold" fontFamily="sans-serif">S</text>
              <text x="0" y={h / 2 + 12} textAnchor="middle" fill="#a8a29e" fontSize="7.5"
                fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                LOG BASE
              </text>
            </g>
          )
        }

        return (
          <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
            <polygon
              points={`0,${-h / 2} ${w / 2},${h / 2} ${-w / 2},${h / 2}`}
              fill="#272521"
              stroke="#78716c"
              strokeWidth="1.5"
            />
            <circle cx="0" cy={h / 6} r="3" fill="#78716c" />
            <text x="0" y={h / 2 + 12} textAnchor="middle" fill="#a8a29e" fontSize="7.5"
              fontFamily="'JetBrains Mono', monospace" fontWeight="700">
              OUTPOST
            </text>
          </g>
        )
      })}

      {/* ── Layer 6: Terrain Region Name Labels ── */}
      <text x="600" y="100" textAnchor="middle" fill="#78716c" fontSize="11"
        fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="2"
        opacity="0.8" style={{ textTransform: 'uppercase' }}>
        NORTHERN RIDGELINE
      </text>
      <text x="130" y="450" textAnchor="middle" fill="#78716c" fontSize="9"
        fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="1.5"
        opacity="0.8" transform="rotate(-70, 130, 450)">
        WESTERN FOREST
      </text>
      <text x="590" y="590" textAnchor="middle" fill="#78716c" fontSize="10"
        fontFamily="'JetBrains Mono', monospace" letterSpacing="2"
        opacity="0.8">
        CENTRAL PLAIN
      </text>
      <text x="620" y="730" textAnchor="middle" fill="#78716c" fontSize="9"
        fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5"
        opacity="0.8">
        SOUTHERN WETLAND
      </text>

      {/* River label */}
      <text
        x="560" y="480"
        fill="#5c87a8" fontSize="8.5"
        fontFamily="'JetBrains Mono', monospace" fontStyle="italic"
        opacity="0.9"
        transform="rotate(35, 560, 480)"
      >
        CORRIDOR RIVER
      </text>

      {/* Road label */}
      <text x="400" y="575" textAnchor="middle" fill="#a89a8c" fontSize="8"
        fontFamily="'JetBrains Mono', monospace"
        opacity="0.9"
        transform="rotate(-25, 400, 575)">
        MSR-ALPHA
      </text>

      {/* ── Layer 7: UTM Grid Overlay ── */}
      {showGrid && (
        <rect width={mapConfig.width} height={mapConfig.height} fill="url(#utmGrid)" pointerEvents="none" />
      )}

      {/* ── Layer 8: Dark Edge Vignette ── */}
      <rect width={mapConfig.width} height={mapConfig.height} fill="url(#borderDarkVignette)" pointerEvents="none" />

      {/* ── Layer 9: Map Border Frame ── */}
      <rect x="2" y="2" width={mapConfig.width - 4} height={mapConfig.height - 4}
        fill="none" stroke="#78716c" strokeWidth="1.5" opacity="0.3" />
    </g>
  )
}
