import type { Entity, SimulationObjective, SimulationEvent, SimulationState, Vector3Tuple, UnitType, Faction } from '@/types/simulation_3d'
import type { TurnResult } from '@/store/wargameStore'

// Known tactical points mapped to 3D world coordinates
export const LOCATION_COORDINATES: Record<string, Vector3Tuple> = {
  'LOC-ALPHA': [-4, 0.35, 2],
  'ALPHA': [-4, 0.35, 2],
  'LOC-BRAVO': [0, 0.25, -1],
  'BRAVO': [0, 0.25, -1],
  'LOC-CHARLIE': [3, 0.3, 1],
  'CHARLIE': [3, 0.3, 1],
  'LOC-DELTA': [5, 0.4, -3.5],
  'DELTA': [5, 0.4, -3.5],
  'FORWARD LOGISTICS POINT ALPHA': [-4, 0.35, 2],
  'RIVER CROSSING CORRIDOR': [0, 0.25, -1],
  'VALLEY PASS': [3, 0.3, 1],
  'EASTERN HIGHWAY': [5, 0.4, -3.5],
}

export function resolveLocation(loc?: string, fallback: Vector3Tuple = [0, 0.3, 0]): Vector3Tuple {
  if (!loc) return fallback
  const upper = loc.toUpperCase().trim()
  if (LOCATION_COORDINATES[upper]) {
    return LOCATION_COORDINATES[upper]
  }
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (upper.includes(key)) {
      return coords
    }
  }
  return fallback
}

export function inferUnitType(unitId: string, name?: string, rawType?: string): UnitType {
  const text = `${unitId} ${name || ''} ${rawType || ''}`.toLowerCase()
  if (text.includes('uav') || text.includes('drone') || text.includes('recon-air')) return 'drone'
  if (text.includes('fighter') || text.includes('jet') || text.includes('fl-')) return 'fighter'
  if (text.includes('interceptor') || text.includes('in-')) return 'interceptor'
  if (text.includes('heli') || text.includes('rotary') || text.includes('hc-')) return 'helicopter'
  if (text.includes('radar') || text.includes('rdr') || text.includes('ew-')) return 'radar'
  if (text.includes('missile') || text.includes('sam') || text.includes('strike')) return 'missile'
  if (text.includes('hq') || text.includes('command') || text.includes('cv-')) return 'command'
  return 'vehicle'
}

export function mapSimulationOutputToRenderState(
  turnResult: TurnResult | null,
  options?: {
    activePresetId?: string
    currentTurn?: number
  }
): {
  units: Entity[]
  objectives: SimulationObjective[]
  events: SimulationEvent[]
  simulationTime: number
} {
  // Baseline initial objectives
  const defaultObjectives: SimulationObjective[] = [
    { id: 'OBJ-01', name: 'Forward Logistics Point Alpha', position: [-4, 0.25, 2], state: 'SECURE' },
    { id: 'OBJ-02', name: 'River Crossing Corridor (LOC-BRAVO)', position: [0, 0.25, -1], state: 'CONTESTED' },
    { id: 'OBJ-03', name: 'Valley Relay Pass', position: [3, 0.25, 1], state: 'MONITORED' },
    { id: 'OBJ-04', name: 'Eastern Airfield', position: [5, 0.25, -3.5], state: 'ACTIVE' },
  ]

  if (!turnResult || !turnResult.simulation_output) {
    // If no turn has run yet, provide default deployment for the theater
    const initialUnits: Entity[] = [
      {
        id: 'BLUE-1',
        name: 'Blue Defense Force 1',
        type: 'vehicle',
        faction: 'BLUE',
        position: [-4, 0.35, 2],
        velocity: [0, 0, 0],
        route: [[-4, 0.35, 2], [-2, 0.3, 1]],
        speed: 40,
        altitude: 0,
        heading: 90,
        status: 'DEPLOYED · 100%',
        strength: 100,
      },
      {
        id: 'BLUE-RECON',
        name: 'Blue Recon UAV',
        type: 'drone',
        faction: 'BLUE',
        position: [-3, 3.2, 0.5],
        velocity: [0, 0, 0],
        route: [[-3, 3.2, 0.5], [0, 3.2, -0.5], [2, 3.2, 0]],
        speed: 240,
        altitude: 3500,
        heading: 75,
        status: 'SURVEILLANCE',
        strength: 100,
      },
      {
        id: 'RED-1',
        name: 'Red Strike Echelon 1',
        type: 'vehicle',
        faction: 'RED',
        position: [4, 0.38, -3],
        velocity: [0, 0, 0],
        route: [[4, 0.38, -3], [1.5, 0.3, -1.8]],
        speed: 45,
        altitude: 0,
        heading: 240,
        status: 'CONVERGING · 100%',
        strength: 100,
      },
      {
        id: 'RED-RECON',
        name: 'Red Tactical Drone',
        type: 'drone',
        faction: 'RED',
        position: [3, 2.8, -2],
        velocity: [0, 0, 0],
        route: [[3, 2.8, -2], [0, 2.8, -1]],
        speed: 210,
        altitude: 3000,
        heading: 220,
        status: 'PROBING',
        strength: 100,
      },
    ]

    return {
      units: initialUnits,
      objectives: defaultObjectives,
      events: [
        {
          id: 'init-0',
          type: 'detection',
          simulationTime: 0,
          agent: 'ORCHESTRATOR',
          message: 'Scenario initialized. Standing by for Turn 1 execution.',
        },
      ],
      simulationTime: 0,
    }
  }

  const simOut = turnResult.simulation_output
  const finalState = simOut.final_state || {}
  const blueUnitsRaw = finalState.blue || {}
  const redUnitsRaw = finalState.red || {}

  const units: Entity[] = []

  // Map Blue Units
  Object.entries(blueUnitsRaw).forEach(([unitId, u]: [string, any], index) => {
    const strength = typeof u.strength === 'number' ? u.strength : 100
    const isDestroyed = strength <= 0 || u.status === 'DESTROYED'
    const loc = u.location || 'LOC-ALPHA'
    const baseCoords = resolveLocation(loc, [-4 + index * 0.8, 0.35, 1.5 + (index % 2) * 0.8])
    const pos: Vector3Tuple = [baseCoords[0], baseCoords[1], baseCoords[2]]

    // If unit destroyed, place slightly submerged or static
    const unitType = inferUnitType(unitId, u.name, u.type)
    const statusText = isDestroyed ? 'DESTROYED' : strength < 40 ? `CRITICAL · ${strength}%` : `OPERATIONAL · ${strength}%`

    units.push({
      id: unitId,
      name: u.name || `Blue Force ${unitId}`,
      type: unitType,
      faction: 'BLUE',
      position: pos,
      velocity: [0, 0, 0],
      route: [pos, [pos[0] + 1.2, pos[1], pos[2] - 0.5]],
      speed: isDestroyed ? 0 : 35,
      altitude: unitType === 'drone' || unitType === 'fighter' ? 3200 : 0,
      heading: 90,
      status: statusText,
      strength,
    })
  })

  // Map Red Units
  Object.entries(redUnitsRaw).forEach(([unitId, u]: [string, any], index) => {
    const strength = typeof u.strength === 'number' ? u.strength : 100
    const isDestroyed = strength <= 0 || u.status === 'DESTROYED'
    const loc = u.location || 'LOC-BRAVO'
    const baseCoords = resolveLocation(loc, [3 - index * 0.8, 0.35, -2 + (index % 2) * 0.8])
    const pos: Vector3Tuple = [baseCoords[0], baseCoords[1], baseCoords[2]]

    const unitType = inferUnitType(unitId, u.name, u.type)
    const statusText = isDestroyed ? 'DESTROYED' : strength < 40 ? `CRITICAL · ${strength}%` : `ACTIVE · ${strength}%`

    units.push({
      id: unitId,
      name: u.name || `Red Force ${unitId}`,
      type: unitType,
      faction: 'RED',
      position: pos,
      velocity: [0, 0, 0],
      route: [pos, [pos[0] - 1.2, pos[1], pos[2] + 0.5]],
      speed: isDestroyed ? 0 : 40,
      altitude: unitType === 'drone' || unitType === 'fighter' ? 2800 : 0,
      heading: 260,
      status: statusText,
      strength,
    })
  })

  // Map Objectives
  const objectives: SimulationObjective[] = []
  const rawObjectives = simOut.objective_results || turnResult.metrics?.objectives || []
  if (Array.isArray(rawObjectives) && rawObjectives.length > 0) {
    rawObjectives.forEach((obj: any, idx: number) => {
      const objName = obj.objective || obj.id || `Objective ${idx + 1}`
      const pos = resolveLocation(objName, defaultObjectives[idx % defaultObjectives.length].position)
      let state = 'MONITORED'
      const statusUpper = (obj.status || '').toUpperCase()
      if (statusUpper.includes('SECURE') || statusUpper.includes('HELD') || statusUpper.includes('SUCCESS')) {
        state = 'SECURE'
      } else if (statusUpper.includes('CONTEST') || statusUpper.includes('ENGAG')) {
        state = 'CONTESTED'
      } else if (statusUpper.includes('FAIL') || statusUpper.includes('LOST')) {
        state = 'CONTESTED'
      }
      objectives.push({
        id: `OBJ-${idx + 1}`,
        name: objName,
        position: pos,
        state,
      })
    })
  } else {
    objectives.push(...defaultObjectives)
  }

  // Map Events
  const events: SimulationEvent[] = []
  const rawEvents = simOut.events || []
  if (Array.isArray(rawEvents)) {
    rawEvents.forEach((evt: any, idx: number) => {
      const evtType = evt.type === 'intercept' || evt.type === 'engagement' ? 'intercept' : 'detection'
      const evtPos: Vector3Tuple = evt.location ? resolveLocation(evt.location) : [0, 1.5, -0.5]
      events.push({
        id: `sim-evt-${idx}`,
        type: evtType,
        simulationTime: (turnResult.turn_number || 1) * 30 + idx * 2,
        agent: evt.agent || 'SIMULATOR',
        message: evt.description || evt.message || `Engagement recorded at Turn ${turnResult.turn_number}`,
        position: evtPos,
      })
    })
  }

  // If there are action results with combat engagement, add visual impact event
  if (Array.isArray(simOut.action_results) && simOut.action_results.length > 0) {
    const engagements = simOut.action_results.filter((a: any) =>
      a.action_type === 'ENGAGE' || a.action_type === 'STRIKE' || (a.details && a.details.includes('combat'))
    )
    engagements.forEach((eng: any, idx: number) => {
      events.push({
        id: `impact-action-${idx}`,
        type: 'intercept',
        simulationTime: (turnResult.turn_number || 1) * 30 + 10,
        agent: 'SIMULATOR',
        message: `Direct engagement: ${eng.unit_id} -> ${eng.target_location || 'Corridor'}`,
        position: resolveLocation(eng.target_location, [0, 1.2, -1]),
      })
    })
  }

  // Add evaluation emergent events
  if (turnResult.evaluation?.emergent_events) {
    turnResult.evaluation.emergent_events.forEach((em: any, idx: number) => {
      events.push({
        id: `emergent-${idx}`,
        type: 'resolved',
        simulationTime: (turnResult.turn_number || 1) * 30 + 20,
        agent: 'EVALUATION',
        message: `${em.type}: ${em.description}`,
      })
    })
  }

  const simulationTime = (turnResult.turn_number || 1) * 30

  return {
    units,
    objectives,
    events,
    simulationTime,
  }
}
