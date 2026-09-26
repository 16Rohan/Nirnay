import type { Entity, SimulationEvent, SimulationState, Vector3Tuple } from '@/types/simulation_3d'
import type { SimulationSource } from './SimulationSource'

const initialEntities: Entity[] = [
  { id: 'UAV-01', name: 'Reconnaissance UAV', type: 'drone', faction: 'BLUE', position: [-5, 3.3, 2], velocity: [0, 0, 0], route: [[-5, 3.3, 2], [-2, 3.5, 3], [1, 3.1, 1], [4, 3.3, 2]], speed: 320, altitude: 4200, heading: 127, status: 'ACTIVE' },
  { id: 'FL-02', name: 'Fighter aircraft', type: 'fighter', faction: 'BLUE', position: [-3, 2.8, -3], velocity: [0, 0, 0], route: [[-3, 2.8, -3], [0, 3.2, -1], [3, 3.5, 1], [5, 3.1, 3]], speed: 610, altitude: 6800, heading: 84, status: 'PATROL' },
  { id: 'IN-01', name: 'Interceptor', type: 'interceptor', faction: 'BLUE', position: [-4, 2.5, 4], velocity: [0, 0, 0], route: [[-4, 2.5, 4], [-1, 3, 3], [2, 3.6, 2], [4, 3.3, 1]], speed: 820, altitude: 7200, heading: 61, status: 'STANDBY' },
  { id: 'HC-03', name: 'Utility helicopter', type: 'helicopter', faction: 'BLUE', position: [-1, 1.35, -5], velocity: [0, 0, 0], route: [[-1, 1.35, -5], [0, 1.4, -3], [1, 1.3, -1], [2, 1.45, 1]], speed: 140, altitude: 850, heading: 37, status: 'TRANSIT' },
  { id: 'RV-04', name: 'Recon vehicle', type: 'vehicle', faction: 'BLUE', position: [-5, .42, 3], velocity: [0, 0, 0], route: [[-5, .42, 3], [-2, .34, 1], [0, .2, -1.4], [2, .28, -2.3], [5, .4, -3.6]], speed: 48, altitude: 0, heading: 91, status: 'MOVING' },
  { id: 'CV-01', name: 'Command vehicle', type: 'command', faction: 'BLUE', position: [3, .42, -4], velocity: [0, 0, 0], route: [[3, .42, -4]], speed: 0, altitude: 0, heading: 0, status: 'ONLINE' },
  { id: 'RDR-02', name: 'Long-range radar', type: 'radar', faction: 'NEUTRAL', position: [2, .25, 3], velocity: [0, 0, 0], route: [[2, .25, 3]], speed: 0, altitude: 0, heading: 0, status: 'SCANNING' },
  { id: 'TR-07', name: 'Transport unit', type: 'vehicle', faction: 'RED', position: [5, .4, -3.6], velocity: [0, 0, 0], route: [[5, .4, -3.6], [2, .28, -2.3], [0, .2, -1.4], [-2, .34, 1]], speed: 36, altitude: 0, heading: 233, status: 'OBSERVED' },
  { id: 'MS-01', name: 'Simulated intercept marker', type: 'missile', faction: 'BLUE', position: [-.5, 2.2, 1], velocity: [0, 0, 0], route: [[-.5, 2.2, 1], [0, 2.6, 1.5], [.6, 2.8, 2], [1.3, 2.4, 2.4]], speed: 900, altitude: 5100, heading: 48, status: 'SIMULATED' },
]

const initialState: SimulationState = {
  scenarioId: 'operation-horizon', scenario: 'Operation Horizon', running: true, speed: 1, simulationTime: 272, tick: 0,
  entities: initialEntities,
  objectives: [
    { id: 'OBJ-01', name: 'North Pass', position: [-4, .22, 2], state: 'SECURE' },
    { id: 'OBJ-02', name: 'River Crossing', position: [0, .22, -1], state: 'MONITORED' },
    { id: 'OBJ-03', name: 'Valley Relay', position: [3, .22, 1], state: 'ACTIVE' },
    { id: 'OBJ-04', name: 'Eastern Airfield', position: [4, .22, -4], state: 'SECURE' },
  ],
  events: [
    { id: 'evt-4', type: 'resolved', simulationTime: 269, agent: 'EVALUATION', message: 'Evaluation cycle updated' },
    { id: 'evt-3', type: 'intercept', simulationTime: 266, agent: 'COMMANDER', message: 'Interceptor response simulated', entityId: 'IN-01', position: [1, 2.5, 2] },
    { id: 'evt-2', type: 'detection', simulationTime: 263, agent: 'RADAR', message: 'Air track acquired', entityId: 'RDR-02' },
  ],
}

const scheduledEvents: Array<{ at: number; type: SimulationEvent['type']; agent: string; message: string; entityId?: string; position?: Vector3Tuple }> = [
  { at: 8, type: 'waypoint', agent: 'ENVIRONMENT', message: 'Reconnaissance unit reached waypoint', entityId: 'UAV-01' },
  { at: 15, type: 'detection', agent: 'RADAR', message: 'Radar sweep acquired a synthetic air track', entityId: 'RDR-02' },
  { at: 24, type: 'launch', agent: 'COMMANDER', message: 'Simulated response sequence initiated', entityId: 'IN-01' },
  { at: 33, type: 'intercept', agent: 'SIMULATION', message: 'Synthetic intercept effect recorded', entityId: 'MS-01', position: [1.3, 2.4, 2.4] },
  { at: 42, type: 'resolved', agent: 'EVALUATION', message: 'Evaluation cycle completed', entityId: 'OBJ-03' },
]

/** Deterministic local data source. Replace with a WebSocket/SSE implementation behind SimulationSource. */
export class MockSimulationEngine implements SimulationSource {
  private state = structuredClone(initialState)
  private listeners = new Set<(state: SimulationState) => void>()
  private timer?: number
  private phase = 0
  private eventIndex = 0

  getSnapshot = () => this.state
  subscribe = (listener: (state: SimulationState) => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  private emit() { this.listeners.forEach(listener => listener(this.state)) }

  start() {
    if (this.timer) return
    this.timer = window.setInterval(() => {
      if (!this.state.running) return
      const dt = .05 * this.state.speed
      this.phase += .012 * this.state.speed
      const simulationTime = this.state.simulationTime + dt
      const next = scheduledEvents[this.eventIndex]
      const elapsed = simulationTime - initialState.simulationTime
      let events = this.state.events
      if (next && elapsed >= next.at) {
        events = [{ ...next, id: `evt-${this.state.tick + 1}`, simulationTime }, ...events].slice(0, 12)
        this.eventIndex += 1
      }
      const entities = this.state.entities.map((entity: Entity, idx: number) => {
        if (entity.route.length < 2) return entity
        if (entity.type === 'interceptor' && elapsed < 18) {
          return { ...entity, velocity: [0, 0, 0] as Vector3Tuple, status: 'STANDBY' as const }
        }
        if (entity.type === 'missile' && elapsed < 24) {
          return { ...entity, velocity: [0, 0, 0] as Vector3Tuple }
        }

        // Realistic speeds and cyclic smooth waypoint interpolation
        const speedScale =
          entity.type === 'missile'
            ? 0.5
            : entity.type === 'interceptor'
            ? 0.18
            : entity.type === 'fighter'
            ? 0.15
            : entity.type === 'drone'
            ? 0.09
            : entity.type === 'helicopter'
            ? 0.08
            : 0.04

        const numSegments = entity.route.length - 1
        // Offset each entity slightly so they don't move in lockstep
        const tTotal = (elapsed * speedScale + idx * 0.45) % numSegments
        const currentSeg = Math.floor(tTotal)
        const segT = tTotal - currentSeg

        const a = entity.route[currentSeg]
        const b = entity.route[currentSeg + 1]

        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        const dz = b[2] - a[2]

        const currentPos: Vector3Tuple = [
          a[0] + dx * segT,
          a[1] + dy * segT,
          a[2] + dz * segT,
        ]

        const velScale = speedScale * 30
        const velocity: Vector3Tuple = [dx * velScale, dy * velScale, dz * velScale]
        const heading = Math.round((Math.atan2(dx, dz) * 180 / Math.PI + 360) % 360)

        return {
          ...entity,
          status: entity.type === 'interceptor' && elapsed >= 18 ? ('ENGAGING' as const) : entity.status,
          position: currentPos,
          velocity,
          heading,
        }
      })
      this.state = { ...this.state, simulationTime, tick: this.state.tick + 1, entities, events }
      this.emit()
    }, 50)
  }

  setRunning(running: boolean) { this.state = { ...this.state, running }; this.emit() }
  setSpeed(speed: number) { this.state = { ...this.state, speed }; this.emit() }
  reset() { this.phase = 0; this.eventIndex = 0; this.state = structuredClone(initialState); this.emit() }
  setScenario(scenarioId: string) {
    this.phase = 0; this.eventIndex = 0
    const labels: Record<string, string> = { 'operation-horizon': 'Operation Horizon', 'valley-sentinel': 'Valley Sentinel', 'coastal-watch': 'Coastal Watch' }
    this.state = { ...structuredClone(initialState), scenarioId, scenario: labels[scenarioId] ?? scenarioId }
    this.emit()
  }
}

export const simulationSource: SimulationSource = new MockSimulationEngine()
