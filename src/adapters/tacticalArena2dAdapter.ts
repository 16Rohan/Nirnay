import type {
  TacticalEntity2D,
  TacticalObjective2D,
  TacticalEvent2D,
  Position2D,
  Faction,
  GroundUnitClass,
  AirUnitClass,
  FormationScale,
} from '../types/tactical_arena_2d'
import type { TurnResult } from '../store/wargameStore'

// Geographic coordinates on the 1200x800 map
export const LOCATION_MAP_2D: Record<string, Position2D> = {
  'LOC-ALPHA': { x: 220, y: 580 },
  'ALPHA': { x: 220, y: 580 },
  'FORWARD LOGISTICS POINT ALPHA': { x: 220, y: 580 },
  'LOC-BRAVO': { x: 420, y: 360 },
  'BRAVO': { x: 420, y: 360 },
  'RIVER CROSSING CORRIDOR': { x: 420, y: 360 },
  'LOC-CHARLIE': { x: 760, y: 280 },
  'CHARLIE': { x: 760, y: 280 },
  'VALLEY PASS': { x: 760, y: 280 },
  'VALLEY RELAY PASS': { x: 760, y: 280 },
  'LOC-DELTA': { x: 1020, y: 300 },
  'DELTA': { x: 1020, y: 300 },
  'EASTERN HIGHWAY': { x: 940, y: 260 },
  'EASTERN AIRFIELD': { x: 1020, y: 300 },
}

export function resolveLocation2D(loc?: any, fallback: Position2D = { x: 600, y: 400 }): Position2D {
  if (!loc) return fallback

  if (typeof loc === 'string') {
    const upper = loc.toUpperCase().trim()
    if (LOCATION_MAP_2D[upper]) return LOCATION_MAP_2D[upper]
    for (const [key, coords] of Object.entries(LOCATION_MAP_2D)) {
      if (upper.includes(key)) return coords
    }
    return fallback
  }

  if (typeof loc === 'object') {
    if (typeof loc.x === 'number' && typeof loc.y === 'number') {
      return { x: loc.x, y: loc.y }
    }
    if (Array.isArray(loc) && loc.length >= 2) {
      if (typeof loc[0] === 'number' && typeof loc[1] === 'number') {
        if (loc.length === 3) {
          return convert3DTo2D(loc as [number, number, number])
        }
        return { x: loc[0], y: loc[1] }
      }
    }
    if (typeof loc.name === 'string') {
      return resolveLocation2D(loc.name, fallback)
    }
    if (typeof loc.location === 'string') {
      return resolveLocation2D(loc.location, fallback)
    }
    if (typeof loc.id === 'string') {
      return resolveLocation2D(loc.id, fallback)
    }
  }

  return fallback
}

// Convert 3D world coords [-10..10] if present to 2D map coords [0..1200, 0..800]
export function convert3DTo2D(pos3d: [number, number, number]): Position2D {
  // Pos3D x: -10 to +10 -> 0 to 1200
  // Pos3D z: -8 to +8 -> 0 to 800
  const x = Math.min(1150, Math.max(50, ((pos3d[0] + 10) / 20) * 1200))
  const y = Math.min(750, Math.max(50, ((pos3d[2] + 8) / 16) * 800))
  return { x, y }
}

export function calculateFormationScale(strengthVal: number = 100): FormationScale {
  const currentStrength = typeof strengthVal === 'number' ? strengthVal : 100
  const maxStrength = 100
  const percentage = Math.max(0, Math.min(100, (currentStrength / maxStrength) * 100))

  // Physically scalable formation element count: 12 elements (100%), down to 2 (15%)
  let elementCount = 12
  let footprintRadius = 26

  if (percentage <= 0) {
    elementCount = 1
    footprintRadius = 14
  } else if (percentage < 30) {
    elementCount = 3
    footprintRadius = 16
  } else if (percentage < 60) {
    elementCount = 6
    footprintRadius = 20
  } else if (percentage < 85) {
    elementCount = 9
    footprintRadius = 23
  }

  return {
    currentStrength,
    maxStrength,
    elementCount,
    footprintRadius,
  }
}

export function mapSimulationToTacticalArena2D(
  turnResult: TurnResult | null,
  rawState?: any
): {
  entities: TacticalEntity2D[]
  objectives: TacticalObjective2D[]
  events: TacticalEvent2D[]
  simulationTime: number
  turnNumber: number
} {
  const defaultObjectives: TacticalObjective2D[] = [
    {
      id: 'OBJ-01',
      name: 'Forward Logistics Base Alpha',
      position: { x: 220, y: 580 },
      state: 'SECURED',
      controlFaction: 'BLUE',
      radius: 35,
    },
    {
      id: 'OBJ-02',
      name: 'River Crossing Corridor (Bridge Alpha)',
      position: { x: 420, y: 360 },
      state: 'CONTESTED',
      radius: 40,
    },
    {
      id: 'OBJ-03',
      name: 'Valley Relay Outpost',
      position: { x: 760, y: 280 },
      state: 'MONITORED',
      controlFaction: 'NEUTRAL',
      radius: 30,
    },
    {
      id: 'OBJ-04',
      name: 'Eastern Airfield Sector',
      position: { x: 1020, y: 300 },
      state: 'UNSECURED',
      controlFaction: 'RED',
      radius: 45,
    },
  ]

  // Default initial sandbox deployment if no turn result is active yet
  if (!turnResult || !turnResult.simulation_output) {
    const initialEntities: TacticalEntity2D[] = [
      {
        id: 'BLUE-01',
        name: 'Blue 1st Mechanized Battalion',
        faction: 'BLUE',
        category: 'GROUND',
        unitClass: 'MECHANIZED',
        position: { x: 220, y: 580 },
        heading: 65,
        speed: 40,
        status: 'ACTIVE',
        strength: calculateFormationScale(100),
        route: [
          { x: 220, y: 580 },
          { x: 380, y: 460 },
          { x: 420, y: 360 },
        ],
        lastEvent: 'Holding staging area at Forward Logistics Point',
      },
      {
        id: 'BLUE-02',
        name: 'Blue 3rd Armored Column',
        faction: 'BLUE',
        category: 'GROUND',
        unitClass: 'ARMORED',
        position: { x: 160, y: 640 },
        heading: 60,
        speed: 35,
        status: 'ACTIVE',
        strength: calculateFormationScale(100),
        route: [
          { x: 160, y: 640 },
          { x: 300, y: 540 },
          { x: 480, y: 440 },
        ],
        lastEvent: 'Advancing along MSR-1 towards river bridge',
      },
      {
        id: 'BLUE-RECON',
        name: 'Blue Surveillance UAV-01',
        faction: 'BLUE',
        category: 'AIR',
        unitClass: 'UAV',
        position: { x: 440, y: 240 },
        heading: 95,
        speed: 240,
        altitude: 3500,
        status: 'ACTIVE',
        strength: calculateFormationScale(100),
        route: [
          { x: 200, y: 300 },
          { x: 440, y: 240 },
          { x: 700, y: 220 },
        ],
        lastEvent: 'Conducting electro-optical scan over corridor',
      },
      {
        id: 'RED-01',
        name: 'Red 7th Shock Brigade',
        faction: 'RED',
        category: 'GROUND',
        unitClass: 'ARMORED',
        position: { x: 880, y: 280 },
        heading: 245,
        speed: 45,
        status: 'ACTIVE',
        strength: calculateFormationScale(100),
        route: [
          { x: 880, y: 280 },
          { x: 680, y: 350 },
          { x: 480, y: 400 },
        ],
        lastEvent: 'Converging on Bridge Bravo crossing axis',
      },
      {
        id: 'RED-02',
        name: 'Red Motorized Infantry Echelon',
        faction: 'RED',
        category: 'GROUND',
        unitClass: 'INFANTRY',
        position: { x: 980, y: 210 },
        heading: 250,
        speed: 35,
        status: 'ACTIVE',
        strength: calculateFormationScale(100),
        route: [
          { x: 980, y: 210 },
          { x: 820, y: 230 },
          { x: 620, y: 290 },
        ],
        lastEvent: 'Screening northern mountain defile approach',
      },
      {
        id: 'RED-AIR',
        name: 'Red Tactical Strike Drone',
        faction: 'RED',
        category: 'AIR',
        unitClass: 'UAV',
        position: { x: 720, y: 360 },
        heading: 235,
        speed: 210,
        altitude: 2800,
        status: 'ACTIVE',
        strength: calculateFormationScale(100),
        route: [
          { x: 940, y: 260 },
          { x: 720, y: 360 },
          { x: 480, y: 440 },
        ],
        lastEvent: 'Tracking Blue vanguard positions',
      },
    ]

    return {
      entities: initialEntities,
      objectives: defaultObjectives,
      events: [
        {
          id: 'evt-init',
          type: 'DETECTION',
          message: 'Scenario initialized. Forces deployed along operational axes.',
          agent: 'ORCHESTRATOR',
          timestamp: '00:00',
          position: { x: 420, y: 360 },
        },
      ],
      simulationTime: 0,
      turnNumber: 1,
    }
  }

  // Authoritative simulation output from backend turn
  const simOut = turnResult.simulation_output
  const finalState = simOut.final_state || {}
  const blueUnitsRaw = finalState.blue || {}
  const redUnitsRaw = finalState.red || {}

  const entities: TacticalEntity2D[] = []

  // Map Blue Forces
  Object.entries(blueUnitsRaw).forEach(([unitId, u]: [string, any], idx) => {
    const rawStrength = typeof u.strength === 'number' ? u.strength : 100
    const isDestroyed = rawStrength <= 0 || u.status === 'DESTROYED'
    const isDamaged = rawStrength < 70 && !isDestroyed
    const locPos = resolveLocation2D(u.location, { x: 220 + idx * 70, y: 580 - idx * 40 })

    const text = `${unitId} ${u.name || ''} ${u.type || ''}`.toLowerCase()
    let category: 'GROUND' | 'AIR' | 'RADAR' = 'GROUND'
    let unitClass: GroundUnitClass | AirUnitClass | 'RADAR' = 'MECHANIZED'

    if (text.includes('drone') || text.includes('uav')) {
      category = 'AIR'
      unitClass = 'UAV'
    } else if (text.includes('fighter') || text.includes('jet') || text.includes('fl-')) {
      category = 'AIR'
      unitClass = 'FIGHTER'
    } else if (text.includes('heli') || text.includes('rotary') || text.includes('hc-')) {
      category = 'AIR'
      unitClass = 'HELICOPTER'
    } else if (text.includes('armor') || text.includes('tank') || text.includes('heavy')) {
      category = 'GROUND'
      unitClass = 'ARMORED'
    } else if (text.includes('infantry') || text.includes('foot')) {
      category = 'GROUND'
      unitClass = 'INFANTRY'
    } else if (text.includes('artillery') || text.includes('howitzer')) {
      category = 'GROUND'
      unitClass = 'ARTILLERY'
    } else if (text.includes('hq') || text.includes('command') || text.includes('cv-')) {
      category = 'GROUND'
      unitClass = 'COMMAND'
    }

    const status = isDestroyed ? 'DESTROYED' : isDamaged ? 'DAMAGED' : 'ACTIVE'

    entities.push({
      id: unitId,
      name: u.name || `Blue Force ${unitId}`,
      faction: 'BLUE',
      category,
      unitClass,
      position: locPos,
      heading: 75,
      speed: isDestroyed ? 0 : 40,
      altitude: category === 'AIR' ? 3200 : undefined,
      status,
      strength: calculateFormationScale(rawStrength),
      route: [
        locPos,
        { x: locPos.x + 120, y: locPos.y - 60 },
      ],
      lastEvent: u.last_action || (isDestroyed ? 'Neutralized in combat' : 'Engaged in operation'),
      rawJson: u,
    })
  })

  // Map Red Forces
  Object.entries(redUnitsRaw).forEach(([unitId, u]: [string, any], idx) => {
    const rawStrength = typeof u.strength === 'number' ? u.strength : 100
    const isDestroyed = rawStrength <= 0 || u.status === 'DESTROYED'
    const isDamaged = rawStrength < 70 && !isDestroyed
    const locPos = resolveLocation2D(u.location, { x: 880 - idx * 70, y: 280 + idx * 40 })

    const text = `${unitId} ${u.name || ''} ${u.type || ''}`.toLowerCase()
    let category: 'GROUND' | 'AIR' | 'RADAR' = 'GROUND'
    let unitClass: GroundUnitClass | AirUnitClass | 'RADAR' = 'ARMORED'

    if (text.includes('drone') || text.includes('uav')) {
      category = 'AIR'
      unitClass = 'UAV'
    } else if (text.includes('fighter') || text.includes('jet') || text.includes('fl-')) {
      category = 'AIR'
      unitClass = 'FIGHTER'
    } else if (text.includes('infantry')) {
      category = 'GROUND'
      unitClass = 'INFANTRY'
    } else if (text.includes('artillery')) {
      category = 'GROUND'
      unitClass = 'ARTILLERY'
    }

    const status = isDestroyed ? 'DESTROYED' : isDamaged ? 'DAMAGED' : 'ACTIVE'

    entities.push({
      id: unitId,
      name: u.name || `Red Strike Unit ${unitId}`,
      faction: 'RED',
      category,
      unitClass,
      position: locPos,
      heading: 255,
      speed: isDestroyed ? 0 : 40,
      altitude: category === 'AIR' ? 2800 : undefined,
      status,
      strength: calculateFormationScale(rawStrength),
      route: [
        locPos,
        { x: locPos.x - 120, y: locPos.y + 60 },
      ],
      lastEvent: u.last_action || (isDestroyed ? 'Neutralized in combat' : 'Engaged in operation'),
      rawJson: u,
    })
  })

  // Map Objectives
  const objectives: TacticalObjective2D[] = []
  const rawObjectives = simOut.objective_results || turnResult.metrics?.objectives || []
  if (Array.isArray(rawObjectives) && rawObjectives.length > 0) {
    rawObjectives.forEach((obj: any, idx: number) => {
      const name = obj.objective || obj.id || `Objective ${idx + 1}`
      const pos = resolveLocation2D(name, defaultObjectives[idx % defaultObjectives.length].position)
      let state: TacticalObjective2D['state'] = 'MONITORED'
      const statusUpper = (obj.status || '').toUpperCase()

      if (statusUpper.includes('SECURE') || statusUpper.includes('HELD') || statusUpper.includes('SUCCESS')) {
        state = 'SECURED'
      } else if (statusUpper.includes('CONTEST') || statusUpper.includes('ENGAG')) {
        state = 'CONTESTED'
      } else if (statusUpper.includes('FAIL') || statusUpper.includes('LOST')) {
        state = 'FAILED'
      }

      objectives.push({
        id: `OBJ-0${idx + 1}`,
        name,
        position: pos,
        state,
        radius: 35,
      })
    })
  } else {
    objectives.push(...defaultObjectives)
  }

  // Map Events
  const events: TacticalEvent2D[] = []
  const rawEvents = simOut.events || []
  if (Array.isArray(rawEvents)) {
    rawEvents.forEach((evt: any, idx: number) => {
      const type = evt.type === 'intercept' || evt.type === 'engagement' ? 'ENGAGEMENT' : 'DETECTION'
      const pos = resolveLocation2D(evt.location, { x: 500, y: 400 })
      events.push({
        id: `evt-${idx}`,
        type,
        message: evt.description || evt.message || `Engagement recorded during turn ${turnResult.turn_number}`,
        agent: evt.agent || 'SIMULATOR',
        timestamp: `0${turnResult.turn_number || 1}:${String(idx * 15).padStart(2, '0')}`,
        position: pos,
      })
    })
  }

  // Extract direct engagements from action results
  if (Array.isArray(simOut.action_results)) {
    simOut.action_results.forEach((act: any, idx: number) => {
      if (act.action_type === 'ENGAGE' || act.action_type === 'STRIKE') {
        const targetPos = resolveLocation2D(act.target_location, { x: 580, y: 430 })
        events.push({
          id: `act-engage-${idx}`,
          type: 'ENGAGEMENT',
          message: `Direct kinetic engagement: ${act.unit_id} -> ${act.target_location || 'Corridor'}`,
          agent: 'COMBAT SIMULATOR',
          timestamp: `0${turnResult.turn_number || 1}:30`,
          position: targetPos,
          sourceEntityId: act.unit_id,
        })
      }
    })
  }

  return {
    entities,
    objectives,
    events,
    simulationTime: (turnResult.turn_number || 1) * 30,
    turnNumber: turnResult.turn_number || 1,
  }
}
