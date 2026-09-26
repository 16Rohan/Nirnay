export type Vector3Tuple = [number, number, number]

export type UnitType = 'drone' | 'fighter' | 'interceptor' | 'helicopter' | 'vehicle' | 'command' | 'radar' | 'missile'
export type Faction = 'BLUE' | 'RED' | 'NEUTRAL'

export interface Entity {
  id: string
  name: string
  type: UnitType
  faction: Faction
  position: Vector3Tuple
  velocity: Vector3Tuple
  route: Vector3Tuple[]
  speed: number
  altitude: number
  heading: number
  status: string
  strength?: number
}

export interface SimulationObjective {
  id: string
  name: string
  position: Vector3Tuple
  state: 'SECURE' | 'CONTESTED' | 'MONITORED' | 'ACTIVE' | string
}

export interface SimulationEvent {
  id: string
  type: 'waypoint' | 'detection' | 'launch' | 'intercept' | 'resolved' | string
  simulationTime: number
  agent: string
  message: string
  entityId?: string
  position?: Vector3Tuple
}

export interface SimulationState {
  scenarioId: string
  scenario: string
  running: boolean
  speed: number
  simulationTime: number
  tick: number
  entities: Entity[]
  objectives: SimulationObjective[]
  events: SimulationEvent[]
}
