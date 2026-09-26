import type { TerrainMapConfiguration } from '../../types/tactical_arena_2d'

/**
 * EASTERN_VALLEY_01 – Deterministic Synthetic Battlefield
 * Dimensions: 1200 × 800 cartographic canvas
 *
 * Features:
 *  - Northern Mountain Ridge (defiles, dominant terrain)
 *  - Western Pine Forest (concealment belt)
 *  - Eastern Woods (Red covered approach)
 *  - Central Open Plain (maneuver corridor)
 *  - Southern Wetland Delta (restricted mobility)
 *  - Corridor River (NW→SE, two tactical crossing bridges)
 *  - MSR Alpha (main paved supply route)
 *  - Forward Logistics Base Alpha, Eastern Airfield, Valley Relay Outpost
 *
 * Color palette: realistic topographic map (not cyberpunk)
 *  - Open terrain: warm sandy-tan (like IGN/OS topographic sheets)
 *  - Forest: muted pine green
 *  - Mountain: stone grey-brown with darker value
 *  - Wetland: muted olive-grey
 *  - Water: standard cartographic slate blue
 *  - Roads: warm cream/buff
 */
export const SYNTHETIC_BATTLEFIELD_MAP: TerrainMapConfiguration = {
  id: 'EASTERN_VALLEY_01',
  name: 'Eastern Valley Operational Sector',
  width: 1200,
  height: 800,
  gridSize: 100,

  regions: [
    // ── Base: warm sandy-tan open terrain (like printed topo paper)
    {
      id: 'central_plain',
      name: 'Central Plain',
      type: 'OPEN',
      polygon: [
        [0, 0], [1200, 0], [1200, 800], [0, 800],
      ],
      fill: '#d8ceac',  // Warm sandy parchment – standard topo open ground
    },

    // ── Northern Mountain Ridge: stone-grey with warm undertone
    {
      id: 'north_ridge',
      name: 'Northern Ridgeline & Peaks',
      type: 'MOUNTAIN',
      polygon: [
        [0, 0], [1200, 0], [1200, 180],
        [1050, 160], [900, 220], [750, 150],
        [600, 210], [450, 140], [300, 230],
        [150, 170], [0, 200],
      ],
      fill: '#b0a48a',  // Stone-brown mountain: slightly darker than open terrain
      elevation: 680,
    },

    // ── Western Pine Forest: muted earthy green (conifer green, like OS maps)
    {
      id: 'western_forest',
      name: 'Western Pine Forest',
      type: 'FOREST',
      polygon: [
        [40, 220], [240, 240], [320, 380],
        [280, 560], [180, 680], [40, 700], [20, 480],
      ],
      fill: '#7a9068',  // Muted pine green
    },

    // ── Eastern Woods: Red's concealed approach
    {
      id: 'eastern_grove',
      name: 'East Ridge Woods',
      type: 'FOREST',
      polygon: [
        [940, 220], [1160, 200], [1180, 420],
        [1020, 400], [920, 300],
      ],
      fill: '#7a9068',
    },

    // ── Southern Wetland: muted olive-grey (bog/swamp topo color)
    {
      id: 'southern_wetland',
      name: 'Southern Wetland Delta',
      type: 'WETLAND',
      polygon: [
        [350, 680], [580, 640], [850, 660],
        [1000, 800], [300, 800],
      ],
      fill: '#9aaa80',  // Wetland olive-grey
    },
  ],

  // ── Elevation Contour Lines (cartographic topo-style)
  contours: [
    {
      elevation: 500,
      path: [
        [0, 170], [200, 150], [400, 120],
        [600, 170], [800, 120], [1000, 140], [1200, 130],
      ],
    },
    {
      elevation: 350,
      path: [
        [0, 230], [220, 220], [450, 190],
        [650, 230], [850, 180], [1050, 210], [1200, 200],
      ],
    },
  ],

  // ── Corridor River (NW→SE through the battle area)
  water: [
    {
      id: 'central_river',
      name: 'Corridor River',
      path: [
        [50, 190], [220, 260], [420, 360],
        [560, 430], [680, 520], [820, 620],
        [1050, 750], [1180, 790],
      ],
      width: 26,
    },
    {
      id: 'north_tributary',
      name: 'North Tributary Stream',
      path: [
        [680, 170], [620, 280], [560, 430],
      ],
      width: 12,
    },
  ],

  // ── Road Network
  roads: [
    {
      id: 'highway_1',
      name: 'Main Supply Route Alpha (MSR-1)',
      path: [
        [80, 720], [280, 620], [480, 510],
        [580, 430],  // Bridge Bravo crossing
        [720, 340], [940, 260], [1140, 220],
      ],
      width: 11,
    },
    {
      id: 'feeder_road_north',
      name: 'Forward Axis Road',
      path: [
        [580, 430], [620, 280], [820, 220], [980, 200],
      ],
      width: 7,
    },
    {
      id: 'valley_cross_road',
      name: 'Valley Connecting Track',
      path: [
        [240, 240],
        [420, 360],  // Bridge Alpha crossing
        [520, 290], [720, 340],
      ],
      width: 7,
    },
  ],

  // ── Tactical Infrastructure
  infrastructure: [
    {
      id: 'bridge_alpha',
      name: 'Bridge Alpha (LOC-BRAVO)',
      type: 'BRIDGE',
      position: [420, 360],
      size: [34, 16],
    },
    {
      id: 'bridge_bravo',
      name: 'Bridge Bravo (MSR Crossing)',
      type: 'BRIDGE',
      position: [580, 430],
      size: [40, 18],
    },
    {
      id: 'fob_alpha',
      name: 'Forward Logistics Point Alpha',
      type: 'LOGISTICS_DEPOT',
      position: [220, 580],
      size: [58, 44],
    },
    {
      id: 'airfield_east',
      name: 'Eastern Military Airfield',
      type: 'AIRFIELD',
      position: [1020, 300],
      size: [140, 58],
    },
    {
      id: 'outpost_relay',
      name: 'Valley Relay Outpost',
      type: 'OUTPOST',
      position: [760, 280],
      size: [32, 32],
    },
  ],
}
