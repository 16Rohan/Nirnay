export type Faction = 'BLUE' | 'RED' | 'NEUTRAL' | 'UNKNOWN'
export type GroundUnitClass = 'INFANTRY' | 'ARMORED' | 'MECHANIZED' | 'ARTILLERY' | 'LOGISTICS' | 'COMMAND'
export type AirUnitClass = 'FIGHTER' | 'INTERCEPTOR' | 'UAV' | 'HELICOPTER' | 'MISSILE'
export type UnitCategory = 'GROUND' | 'AIR' | 'RADAR'

export interface Position2D {
  x: number // Map coordinate (e.g. 0 to 1200)
  y: number // Map coordinate (e.g. 0 to 800)
}

export interface FormationScale {
  currentStrength: number
  maxStrength: number
  elementCount: number // Scaled number of glyphs to draw (e.g. 2 to 12)
  footprintRadius: number
}

export interface TacticalEntity2D {
  id: string
  name: string
  faction: Faction
  category: UnitCategory
  unitClass: GroundUnitClass | AirUnitClass | 'RADAR'
  position: Position2D
  heading: number // in degrees 0-360
  speed: number // m/s or km/h
  altitude?: number // for aircraft
  status: 'ACTIVE' | 'DAMAGED' | 'DISABLED' | 'DESTROYED'
  strength: FormationScale
  route: Position2D[]
  assignedObjectiveId?: string
  lastEvent?: string
  rawJson?: Record<string, any>
}

export interface TacticalObjective2D {
  id: string
  name: string
  position: Position2D
  state: 'UNSECURED' | 'CONTESTED' | 'SECURED' | 'FAILED' | 'MONITORED'
  controlFaction?: Faction
  radius: number
}

export interface TacticalEvent2D {
  id: string
  type: 'ENGAGEMENT' | 'DAMAGE' | 'DESTRUCTION' | 'MOVEMENT' | 'DETECTION' | 'OBJECTIVE_CHANGE'
  message: string
  agent: string
  timestamp: string
  position: Position2D
  targetPosition?: Position2D
  sourceEntityId?: string
  targetEntityId?: string
  intensity?: number
}

export type ArenaViewMode = 'STRATEGIC' | 'OPERATIONAL' | 'EVENT'

export interface ArenaViewport {
  x: number
  y: number
  width: number
  height: number
}

export interface TerrainRegion {
  id: string
  name: string
  type: 'MOUNTAIN' | 'FOREST' | 'OPEN' | 'WETLAND' | 'URBAN' | 'WATER'
  polygon: [number, number][]
  fill: string
  elevation?: number
}

export interface TerrainInfrastructure {
  id: string
  name: string
  type: 'ROAD' | 'BRIDGE' | 'AIRFIELD' | 'OUTPOST' | 'LOGISTICS_DEPOT'
  path?: [number, number][]
  position?: [number, number]
  size?: [number, number]
}

export interface TerrainMapConfiguration {
  id: string
  name: string
  width: number
  height: number
  gridSize: number
  regions: TerrainRegion[]
  water: { id: string; name: string; path: [number, number][]; width: number }[]
  roads: { id: string; name: string; path: [number, number][]; width: number }[]
  infrastructure: TerrainInfrastructure[]
  contours: { elevation: number; path: [number, number][] }[]
}
