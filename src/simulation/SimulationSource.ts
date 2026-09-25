import type { SimulationState } from '../../../contracts/simulation_3d'

/** Stable boundary for the renderer: implementations publish snapshots, never Three.js objects. */
export interface SimulationSource {
  getSnapshot: () => SimulationState
  subscribe: (listener: (state: SimulationState) => void) => () => void
  start: () => void
  setRunning: (running: boolean) => void
  setSpeed: (speed: number) => void
  reset: () => void
  setScenario: (scenarioId: string) => void
}
