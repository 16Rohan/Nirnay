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
        {/* Map parchment base – warm off-white like topographic paper */}
        <linearGradient id="mapBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8e0cb" />
          <stop offset="50%" stopColor="#ddd5bb" />
          <stop offset="100%" stopColor="#d4c9a8" />
        </linearGradient>

        {/* Mountain hill-shade gradient – darker on south/east faces */}
        <linearGradient id="mountainShade" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#a59880" stopOpacity="0" />
          <stop offset="40%" stopColor="#9a8d72" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7a6e56" stopOpacity="0.55" />
        </linearGradient>

        {/* Forest canopy texture – dense stipple of dark greens */}
        <pattern id="forestPattern" width="14" height="14" patternUnits="userSpaceOnUse">
          <ellipse cx="4" cy="4" rx="3" ry="2.5" fill="#4a6640" opacity="0.55" />
          <ellipse cx="10" cy="10" rx="3" ry="2.5" fill="#3d5836" opacity="0.55" />
          <circle cx="10" cy="3" r="1.5" fill="#5a7a50" opacity="0.4" />
          <circle cx="3" cy="11" r="1.5" fill="#5a7a50" opacity="0.4" />
        </pattern>

        {/* Wetland marsh reeds pattern */}
        <pattern id="wetlandPattern" width="18" height="18" patternUnits="userSpaceOnUse">
          <line x1="2" y1="9" x2="6" y2="9" stroke="#5a7a60" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4" y1="5" x2="4" y2="9" stroke="#5a7a60" strokeWidth="1" />
          <line x1="11" y1="15" x2="15" y2="15" stroke="#5a7a60" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13" y1="11" x2="13" y2="15" stroke="#5a7a60" strokeWidth="1" />
        </pattern>

        {/* Mountain rock texture – angled hatch */}
        <pattern id="mountainPattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="10" y2="0" stroke="#8a7d65" strokeWidth="0.8" opacity="0.35" />
        </pattern>

        {/* Subtle UTM/MGRS grid – faint, professional */}
        <pattern id="utmGrid" width={mapConfig.gridSize} height={mapConfig.gridSize} patternUnits="userSpaceOnUse">
          <path
            d={`M ${mapConfig.gridSize} 0 L 0 0 0 ${mapConfig.gridSize}`}
            fill="none"
            stroke="rgba(100,90,70,0.10)"
            strokeWidth="0.75"
          />
        </pattern>

        {/* Map border vignette */}
        <radialGradient id="borderVignette" cx="50%" cy="50%" r="70%">
          <stop offset="75%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(100,85,60,0.18)" />
        </radialGradient>

        {/* Water shimmer */}
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6fa8c0" />
          <stop offset="100%" stopColor="#5490ad" />
        </linearGradient>

        {/* Filter: slight paper texture noise */}
        <filter id="paperGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComponentTransfer in="blended">
            <feFuncA type="linear" slope="1" />
          </feComponentTransfer>
        </filter>

        {/* Drop shadow for infrastructure elements */}
        <filter id="shadowSm" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" floodColor="#5a4a30" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* ── Layer 0: Map Paper Background ── */}
      <rect
        x="0"
        y="0"
        width={mapConfig.width}
        height={mapConfig.height}
        fill="url(#mapBaseGrad)"
      />

      {/* ── Layer 1: Terrain Regions (Land Cover) ── */}
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
            {/* Subtle region outline for cartographic edge definition */}
            <polygon points={points} fill="none" stroke="rgba(90,75,50,0.20)" strokeWidth="1" />
          </g>
        )
      })}

      {/* ── Layer 2: Elevation Contour Lines ── */}
      {showContours &&
        mapConfig.contours.map((contour, i) => {
          const pathD = contour.path.reduce((acc, curr, idx) => {
            return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`
          }, '')
          const isIndex = i === 0 // bolder "index contour" every 5th
          return (
            <g key={`contour-${i}`}>
              <path
                d={pathD}
                fill="none"
                stroke="#8a7050"
                strokeWidth={isIndex ? 1.5 : 0.9}
                opacity={isIndex ? 0.50 : 0.32}
              />
              {/* Elevation label on index contours */}
              {isIndex && contour.path[2] && (
                <text
                  x={contour.path[2][0] + 3}
                  y={contour.path[2][1] - 3}
                  fill="#7a6040"
                  fontSize="8"
                  fontFamily="'JetBrains Mono', monospace"
                  opacity="0.65"
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
            {/* River bank (darker) */}
            <path
              d={pathD}
              fill="none"
              stroke="#4a7a92"
              strokeWidth={w.width + 5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
            />
            {/* Main water body */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#waterGrad)"
              strokeWidth={w.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.90"
            />
            {/* Water shimmer centre line */}
            <path
              d={pathD}
              fill="none"
              stroke="#a8d8e8"
              strokeWidth={w.width * 0.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.45"
            />
          </g>
        )
      })}

      {/* ── Layer 4: Road Network ── */}
      {mapConfig.roads.map(r => {
        const pathD = r.path.reduce((acc, curr, idx) => {
          return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`
        }, '')
        const isHighway = r.width >= 10
        return (
          <g key={r.id}>
            {/* Road base/casing */}
            <path
              d={pathD}
              fill="none"
              stroke="#88785a"
              strokeWidth={r.width + 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
            {/* Paved surface */}
            <path
              d={pathD}
              fill="none"
              stroke="#c8b898"
              strokeWidth={r.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Highway center stripe */}
            {isHighway && (
              <path
                d={pathD}
                fill="none"
                stroke="#e0cfa8"
                strokeWidth="1.5"
                strokeDasharray="10 7"
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
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#b0a080" stroke="#7a6840" strokeWidth="1.5" rx="1" />
              {/* Guardrail lines */}
              <line x1={-w / 2} y1={-h / 2 + 2} x2={w / 2} y2={-h / 2 + 2} stroke="#7a6840" strokeWidth="1" />
              <line x1={-w / 2} y1={h / 2 - 2} x2={w / 2} y2={h / 2 - 2} stroke="#7a6840" strokeWidth="1" />
              {/* Center marking */}
              <line x1={-w / 2 + 4} y1="0" x2={w / 2 - 4} y2="0" stroke="#e8d8a0" strokeWidth="1" strokeDasharray="4 3" />
              {/* Bridge label */}
              <text x="0" y={h / 2 + 11} textAnchor="middle" fill="#5a4830" fontSize="8"
                fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                {inf.name.split('(')[0].trim()}
              </text>
            </g>
          )
        }

        if (inf.type === 'AIRFIELD') {
          return (
            <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
              {/* Airfield apron / tarmac */}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#8a8070" stroke="#5a5040" strokeWidth="1.5" rx="2" />
              {/* Runway surface */}
              <rect x={-w / 2 + 4} y={-4} width={w - 8} height={8} fill="#707060" stroke="none" />
              {/* Runway centerline and threshold markings */}
              <line x1={-w / 2 + 8} y1="0" x2={w / 2 - 8} y2="0" stroke="#d8d0a0" strokeWidth="1.5" strokeDasharray="8 5" />
              <line x1={-w / 2 + 8} y1="-3" x2={-w / 2 + 8} y2="3" stroke="#d8d0a0" strokeWidth="1.5" />
              <line x1={w / 2 - 8} y1="-3" x2={w / 2 - 8} y2="3" stroke="#d8d0a0" strokeWidth="1.5" />
              {/* Aircraft silhouette indicator */}
              <text x="0" y={-h / 2 - 6} textAnchor="middle" fill="#5a4830" fontSize="9"
                fontFamily="sans-serif">✈</text>
              <text x="0" y={h / 2 + 12} textAnchor="middle" fill="#4a3820" fontSize="7.5"
                fontFamily="'JetBrains Mono', monospace" fontWeight="700" letterSpacing="0.5">
                AIRFIELD
              </text>
            </g>
          )
        }

        if (inf.type === 'LOGISTICS_DEPOT') {
          return (
            <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
              {/* Compound perimeter */}
              <rect x={-w / 2} y={-h / 2} width={w} height={h}
                fill="#c0b090" fillOpacity="0.3"
                stroke="#7a6840" strokeWidth="1.5" strokeDasharray="5 2" />
              {/* Warehouse buildings */}
              <rect x={-w / 2 + 4} y={-h / 2 + 4} width={w / 3 - 2} height={h * 0.55} fill="#a09070" stroke="#6a5830" strokeWidth="1" />
              <rect x={-w / 2 + w / 3 + 4} y={-h / 2 + 4} width={w / 3 - 2} height={h * 0.55} fill="#a09070" stroke="#6a5830" strokeWidth="1" />
              {/* Supply symbol (boxed S) */}
              <rect x={-6} y={-6} width={12} height={12} fill="#ddd0a8" stroke="#6a5830" strokeWidth="1" rx="1" />
              <text x="0" y="4.5" textAnchor="middle" fill="#4a3820" fontSize="9" fontWeight="bold"
                fontFamily="sans-serif">S</text>
              <text x="0" y={h / 2 + 12} textAnchor="middle" fill="#4a3820" fontSize="7.5"
                fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                LOG BASE
              </text>
            </g>
          )
        }

        // Default: Outpost / Relay post
        return (
          <g key={inf.id} transform={`translate(${x}, ${y})`} filter="url(#shadowSm)">
            <polygon
              points={`0,${-h / 2} ${w / 2},${h / 2} ${-w / 2},${h / 2}`}
              fill="#b0a080"
              stroke="#6a5830"
              strokeWidth="1.5"
            />
            <circle cx="0" cy={h / 6} r="3" fill="#d08040" />
            <text x="0" y={h / 2 + 12} textAnchor="middle" fill="#4a3820" fontSize="7.5"
              fontFamily="'JetBrains Mono', monospace" fontWeight="700">
              OUTPOST
            </text>
          </g>
        )
      })}

      {/* ── Layer 6: Terrain Region Name Labels ── */}
      {/* Mountain region label */}
      <text x="600" y="100" textAnchor="middle" fill="#6a5840" fontSize="11"
        fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="2"
        opacity="0.6" style={{ textTransform: 'uppercase' }}>
        NORTHERN RIDGELINE
      </text>
      <text x="130" y="450" textAnchor="middle" fill="#3d5030" fontSize="9"
        fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="1.5"
        opacity="0.55" transform="rotate(-70, 130, 450)">
        WESTERN FOREST
      </text>
      <text x="590" y="590" textAnchor="middle" fill="#6a5840" fontSize="10"
        fontFamily="'JetBrains Mono', monospace" letterSpacing="2"
        opacity="0.45">
        CENTRAL PLAIN
      </text>
      <text x="620" y="730" textAnchor="middle" fill="#4a5840" fontSize="9"
        fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5"
        opacity="0.5">
        SOUTHERN WETLAND
      </text>

      {/* River name label */}
      <text
        x="560" y="480"
        fill="#3a6888" fontSize="8"
        fontFamily="'JetBrains Mono', monospace" fontStyle="italic"
        opacity="0.7"
        transform="rotate(35, 560, 480)"
      >
        CORRIDOR RIVER
      </text>

      {/* MSR road label */}
      <text x="400" y="575" textAnchor="middle" fill="#7a6840" fontSize="7.5"
        fontFamily="'JetBrains Mono', monospace"
        opacity="0.6"
        transform="rotate(-25, 400, 575)">
        MSR-ALPHA
      </text>

      {/* ── Layer 7: UTM/MGRS Grid Overlay ── */}
      {showGrid && (
        <rect width={mapConfig.width} height={mapConfig.height} fill="url(#utmGrid)" pointerEvents="none" />
      )}

      {/* ── Layer 8: Border Vignette ── */}
      <rect width={mapConfig.width} height={mapConfig.height} fill="url(#borderVignette)" pointerEvents="none" />

      {/* ── Layer 9: Map Border Frame ── */}
      <rect x="2" y="2" width={mapConfig.width - 4} height={mapConfig.height - 4}
        fill="none" stroke="#8a7050" strokeWidth="2" opacity="0.5" />
    </g>
  )
}
