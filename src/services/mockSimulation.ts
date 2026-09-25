export type UnitKind = 'drone' | 'fighter' | 'interceptor' | 'helicopter' | 'vehicle' | 'command' | 'radar' | 'missile'
export type Unit = { id: string; name: string; kind: UnitKind; faction: 'BLUE' | 'RED' | 'NEUTRAL'; position: [number, number, number]; route: [number, number, number][]; speed: number; altitude: number; heading: number; status: string }
export type Objective = { id: string; name: string; position: [number, number, number]; state: string }
export type SimState = { running: boolean; speed: number; seconds: number; scenario: string; units: Unit[]; objectives: Objective[]; events: string[] }
export interface SimulationDataAdapter {
  getSnapshot: () => SimState
  subscribe: (listener: (state: SimState) => void) => () => void
  start: () => void
  setRunning: (running: boolean) => void
  setSpeed: (speed: number) => void
  reset: () => void
  setScenario: (scenario: string) => void
}

const initialUnits: Unit[] = [
  { id: 'UAV-01', name: 'Reconnaissance UAV', kind: 'drone', faction: 'BLUE', position: [-5, 3.3, 2], route: [[-5, 3.3, 2], [-2, 3.5, 3], [1, 3.1, 1], [4, 3.3, 2]], speed: 320, altitude: 4200, heading: 127, status: 'ACTIVE' },
  { id: 'FL-02', name: 'Fighter aircraft', kind: 'fighter', faction: 'BLUE', position: [-3, 2.8, -3], route: [[-3, 2.8, -3], [0, 3.2, -1], [3, 3.5, 1], [5, 3.1, 3]], speed: 610, altitude: 6800, heading: 84, status: 'PATROL' },
  { id: 'IN-01', name: 'Interceptor', kind: 'interceptor', faction: 'BLUE', position: [-4, 2.5, 4], route: [[-4, 2.5, 4], [-1, 3, 3], [2, 3.6, 2], [4, 3.3, 1]], speed: 820, altitude: 7200, heading: 61, status: 'STANDBY' },
  { id: 'HC-03', name: 'Utility helicopter', kind: 'helicopter', faction: 'BLUE', position: [-1, 1.35, -5], route: [[-1, 1.35, -5], [0, 1.4, -3], [1, 1.3, -1], [2, 1.45, 1]], speed: 140, altitude: 850, heading: 37, status: 'TRANSIT' },
  { id: 'RV-04', name: 'Recon vehicle', kind: 'vehicle', faction: 'BLUE', position: [-5, .42, 3], route: [[-5, .42, 3], [-2, .34, 1], [0, .2, -1.4], [2, .28, -2.3], [5, .4, -3.6]], speed: 48, altitude: 0, heading: 91, status: 'MOVING' },
  { id: 'CV-01', name: 'Command vehicle', kind: 'command', faction: 'BLUE', position: [3, .42, -4], route: [[3, .42, -4]], speed: 0, altitude: 0, heading: 0, status: 'ONLINE' },
  { id: 'RDR-02', name: 'Long-range radar', kind: 'radar', faction: 'NEUTRAL', position: [2, .25, 3], route: [[2, .25, 3]], speed: 0, altitude: 0, heading: 0, status: 'SCANNING' },
  { id: 'TR-07', name: 'Transport unit', kind: 'vehicle', faction: 'RED', position: [5, .4, -3.6], route: [[5, .4, -3.6], [2, .28, -2.3], [0, .2, -1.4], [-2, .34, 1]], speed: 36, altitude: 0, heading: 233, status: 'OBSERVED' },
  { id: 'MS-01', name: 'Simulated intercept marker', kind: 'missile', faction: 'BLUE', position: [-.5, 2.2, 1], route: [[-.5, 2.2, 1], [0, 2.6, 1.5], [.6, 2.8, 2], [1.3, 2.4, 2.4]], speed: 900, altitude: 5100, heading: 48, status: 'SIMULATED' },
]
const initial: SimState = { running: true, speed: 1, seconds: 272, scenario: 'Operation Horizon', units: initialUnits, objectives: [
  { id: 'OBJ-01', name: 'North Pass', position: [-4, .22, 2], state: 'SECURE' },
  { id: 'OBJ-02', name: 'River Crossing', position: [0, .22, -1], state: 'MONITORED' },
  { id: 'OBJ-03', name: 'Valley Relay', position: [3, .22, 1], state: 'ACTIVE' },
  { id: 'OBJ-04', name: 'Eastern Airfield', position: [4, .22, -4], state: 'SECURE' },
], events: ['Evaluation cycle updated', 'Interceptor response simulated', 'Air track acquired', 'Radar sweep completed'] }

// Adapter boundary: replace this class with a backend-fed adapter later; scene consumers only read SimState.
export class MockSimulationAdapter implements SimulationDataAdapter {
  private state = structuredClone(initial)
  private listeners = new Set<(state: SimState) => void>()
  private timer?: number
  private tick = 0
  private nextEvent = 0
  private readonly scheduledEvents = [
    { at: 9, message: 'Reconnaissance unit reached waypoint' },
    { at: 18, message: 'Radar sweep acquired a synthetic air track' },
    { at: 29, message: 'Interceptor route update simulated' },
    { at: 42, message: 'Evaluation cycle completed' },
  ]
  getSnapshot = () => this.state
  subscribe = (listener: (state: SimState) => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  private emit() { this.listeners.forEach(listener => listener(this.state)) }
  start() {
    if (this.timer) return
    this.timer = window.setInterval(() => {
      if (!this.state.running) return
      this.tick += .012 * this.state.speed
      const seconds = this.state.seconds + .25 * this.state.speed
      const scheduled = this.scheduledEvents[this.nextEvent]
      const events = scheduled && seconds - initial.seconds >= scheduled.at ? [scheduled.message, ...this.state.events].slice(0, 8) : this.state.events
      if (events !== this.state.events) this.nextEvent += 1
      this.state = { ...this.state, seconds, events, units: this.state.units.map(unit => {
        if (unit.route.length < 2) return unit
        const phase = this.tick * (unit.kind === 'missile' ? 1.8 : unit.kind === 'helicopter' ? .25 : .42) + initialUnits.findIndex(u => u.id === unit.id) * .11
        const segment = Math.floor(phase) % (unit.route.length - 1), t = phase % 1
        const a = unit.route[segment], b = unit.route[segment + 1]
        const heading = Math.round((Math.atan2(b[0] - a[0], b[2] - a[2]) * 180 / Math.PI + 360) % 360)
        return { ...unit, position: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], heading }
      }) }
      this.emit()
    }, 250)
  }
  setRunning(running: boolean) { this.state = { ...this.state, running }; this.emit() }
  setSpeed(speed: number) { this.state = { ...this.state, speed }; this.emit() }
  reset() { this.tick = 0; this.nextEvent = 0; this.state = structuredClone(initial); this.emit() }
  setScenario(scenario: string) { this.tick = 0; this.nextEvent = 0; this.state = { ...structuredClone(initial), scenario }; this.emit() }
}
export const simulationAdapter = new MockSimulationAdapter()
