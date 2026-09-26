import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, Sky } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Entity, SimulationEvent, SimulationObjective } from '@/types/simulation_3d'

export type CameraMode = 'overview' | 'follow' | 'aircraft' | 'terrain' | 'objective' | 'tactical'

type Props = {
  units: Entity[]
  objectives: SimulationObjective[]
  events: SimulationEvent[]
  simulationTime: number
  selected: string | null
  onSelect: (id: string) => void
  layers: Record<string, boolean>
  cameraMode: CameraMode
}

// Gentle, realistic terrain elevation
const heightAt = (x: number, z: number) =>
  0.15 + Math.sin(x * 0.35) * 0.35 + Math.cos(z * 0.3) * 0.28 + Math.sin((x + z) * 0.22) * 0.15

// ─────────────────────────────────────────────────────────────
// REALISTIC TERRAIN & MILITARY CAMOUFLAGE PALETTE
// ─────────────────────────────────────────────────────────────
const REAL_PALETTE = {
  // Terrain & Nature
  grassLow: '#475e3a',
  grassMid: '#5c7849',
  dirtRock: '#736855',
  mountainPeak: '#8a7d6d',
  waterRiver: '#2b657a',
  waterSpec: '#42a5c4',
  asphaltRoad: '#3b3f42',
  runwayMark: '#d0c8b8',

  // Factions - Realistic military colors with distinct identifiable trims
  blueHull: '#244563',      // Blue Force Navy/Camo
  blueTrim: '#38bdf8',      // Vivid Cyan Identification
  redHull: '#732c2c',       // Red Force Desaturated Camo
  redTrim: '#ef4444',       // Vivid Crimson Identification
  neutralHull: '#575f68',   // Neutral Steely Grey
  neutralTrim: '#f59e0b',   // Amber Gold
  destroyedHull: '#1a1a1a', // Burnt wreckage
}

// ─────────────────────────────────────────────────────────────
// REALISTIC TERRAIN, ROADS, RIVER & PROPS
// ─────────────────────────────────────────────────────────────
function Ground({ showInfrastructure }: { showInfrastructure: boolean }) {
  // Procedural terrain with vertex colors for realistic grass/dirt/rock blending
  const terrain = useMemo(() => {
    const g = new THREE.PlaneGeometry(30, 24, 140, 110)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position as THREE.BufferAttribute
    const count = p.count
    const colors = new Float32Array(count * 3)

    const cGrass = new THREE.Color(REAL_PALETTE.grassMid)
    const cLowGrass = new THREE.Color(REAL_PALETTE.grassLow)
    const cRock = new THREE.Color(REAL_PALETTE.dirtRock)
    const cPeak = new THREE.Color(REAL_PALETTE.mountainPeak)

    for (let i = 0; i < count; i++) {
      const x = p.getX(i)
      const z = p.getZ(i)
      const y = heightAt(x, z)
      p.setY(i, y)

      // Vertex color based on elevation and slope
      const c = new THREE.Color()
      if (y < 0.2) {
        c.lerpColors(cLowGrass, cGrass, (y + 0.3) / 0.5)
      } else if (y < 0.55) {
        c.lerpColors(cGrass, cRock, (y - 0.2) / 0.35)
      } else {
        c.lerpColors(cRock, cPeak, (y - 0.55) / 0.4)
      }

      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  // Sinuous natural river flowing through the valley
  const river = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-12, 0.12, -7),
        new THREE.Vector3(-7, 0.14, -4),
        new THREE.Vector3(-2, 0.14, -1.2),
        new THREE.Vector3(2, 0.13, -0.2),
        new THREE.Vector3(7, 0.14, 2.8),
        new THREE.Vector3(12, 0.12, 5.2),
      ]),
    []
  )

  // Tactical paved supply road
  const road = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-11, 0.16, 6),
        new THREE.Vector3(-6, 0.42, 4),
        new THREE.Vector3(-2, 0.45, 1.5),
        new THREE.Vector3(0.5, 0.28, -1.5),
        new THREE.Vector3(3.5, 0.38, -2.8),
        new THREE.Vector3(7, 0.52, -4.6),
        new THREE.Vector3(11, 0.32, -5.8),
      ]),
    []
  )

  return (
    <>
      {/* Textured Real-World Color Terrain */}
      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.08}
          flatShading={false}
        />
      </mesh>

      {/* Surrounding Landscape Skirt */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#32422b" roughness={0.95} />
      </mesh>

      {/* Subtle Military UTM Coordinate Grid Overlay */}
      <gridHelper
        args={[30, 30, 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)']}
        position={[0, 0.08, 0]}
      />

      {/* Realistic Mountain Ridges & Peaks */}
      {[-9, -7.2, -5.5, 7.5, 9.2].map((x, i) => (
        <mesh
          key={i}
          position={[x, 1.4 + (i % 2) * 0.5, -3 + i * 0.8]}
          scale={[3.2, 2.6 + (i % 2) * 0.8, 3.6]}
          castShadow
        >
          <coneGeometry args={[1, 3, 7]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#635a4d' : '#73695c'}
            roughness={0.92}
            metalness={0.12}
            flatShading
          />
        </mesh>
      ))}

      {/* Natural Water River */}
      <mesh position={[0, 0.06, 0]}>
        <tubeGeometry args={[river, 120, 0.42, 8, false]} />
        <meshStandardMaterial
          color={REAL_PALETTE.waterRiver}
          roughness={0.15}
          metalness={0.45}
          emissive="#123d4d"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Infrastructure Overlay: Roads, Bridges, Airfield, Watchtowers */}
      <group visible={showInfrastructure}>
        {/* Asphalt Road */}
        <mesh position={[0, 0.14, 0]}>
          <tubeGeometry args={[road, 120, 0.22, 6, false]} />
          <meshStandardMaterial
            color={REAL_PALETTE.asphaltRoad}
            roughness={0.75}
            metalness={0.2}
          />
        </mesh>

        {/* Concrete River Bridge */}
        <mesh position={[0.5, 0.32, -0.8]} rotation={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.8, 0.12, 0.55]} />
          <meshStandardMaterial color="#6e7378" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* FOB Outpost Buildings & Hangar */}
        {Array.from({ length: 6 }, (_, i) => {
          const posX = -4.5 + (i % 3) * 0.75
          const posZ = -3.8 + Math.floor(i / 3) * 0.75
          const posY = heightAt(posX, posZ) + 0.12
          return (
            <group key={i} position={[posX, posY, posZ]}>
              <mesh castShadow>
                <boxGeometry args={[0.45, 0.24, 0.45]} />
                <meshStandardMaterial color="#545b63" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.16, 0]}>
                <coneGeometry args={[0.26, 0.16, 4]} />
                <meshStandardMaterial color="#3b4247" roughness={0.9} />
              </mesh>
            </group>
          )
        })}

        {/* Airfield Runway Strip */}
        <group position={[4.5, heightAt(4.5, -4) + 0.05, -4]} rotation={[0, -0.4, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[4.2, 0.04, 1.2]} />
            <meshStandardMaterial color="#2d3339" roughness={0.85} />
          </mesh>
          {/* Runway Centerline Markings */}
          {[-1.4, -0.7, 0, 0.7, 1.4].map(mx => (
            <mesh key={mx} position={[mx, 0.03, 0]}>
              <planeGeometry args={[0.35, 0.06]} />
              <meshBasicMaterial color="#f0ede6" />
            </mesh>
          ))}
        </group>
      </group>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// REALISTIC MILITARY ASSETS (VEHICLES, AIRCRAFT, DRONES)
// ─────────────────────────────────────────────────────────────

// Destroyed Unit State: Smoldering broken armor
function DestroyedWreckage() {
  const smokeRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (smokeRef.current) smokeRef.current.rotation.y += delta * 0.4
  })

  return (
    <group position={[0, 0.08, 0]}>
      {/* Shattered Hull */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.18, 0.4]} />
        <meshStandardMaterial color="#1a1c1e" roughness={0.95} />
      </mesh>
      <mesh position={[0.12, 0.14, -0.08]} rotation={[0.25, 0.5, 0.15]}>
        <boxGeometry args={[0.3, 0.14, 0.22]} />
        <meshStandardMaterial color="#2a2d30" roughness={0.9} />
      </mesh>
      {/* Burning Engine Fire */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#ff5511"
          emissive="#ff4400"
          emissiveIntensity={2.0}
        />
      </mesh>
      {/* Smoke Indicator */}
      <group ref={smokeRef} position={[0, 0.35, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.16, 0.45, 6]} />
          <meshBasicMaterial color="#22262a" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  )
}

// Fighter & Interceptor Aircraft
function AircraftModel({
  kind,
  faction,
}: {
  kind: 'drone' | 'fighter' | 'interceptor'
  faction: 'BLUE' | 'RED' | 'NEUTRAL'
}) {
  const isRed = faction === 'RED'
  const isBlue = faction === 'BLUE'
  const hullColor = isRed ? REAL_PALETTE.redHull : isBlue ? REAL_PALETTE.blueHull : REAL_PALETTE.neutralHull
  const trimColor = isRed ? REAL_PALETTE.redTrim : isBlue ? REAL_PALETTE.blueTrim : REAL_PALETTE.neutralTrim
  const wingSpan = kind === 'drone' ? 1.5 : kind === 'interceptor' ? 0.85 : 1.15

  return (
    <group>
      {/* Aerodynamic Fuselage */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.12, 0.85, 8]} />
        <meshStandardMaterial color={hullColor} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Camo / Faction Stripe */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
        <meshStandardMaterial color={trimColor} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Delta Wings */}
      <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.18, wingSpan * 1.6, 4]} />
        <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cockpit Canopy Glass */}
      <mesh position={[0, 0.09, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
        <meshStandardMaterial
          color="#b0e0ff"
          roughness={0.1}
          metalness={0.85}
          emissive="#60a5fa"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Jet Engine Afterburner Plume */}
      <mesh position={[0, 0, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.08, 8]} />
        <meshStandardMaterial
          color="#ffaa44"
          emissive="#ff8800"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Wingtip Tactical Nav Lights */}
      {[-wingSpan * 0.75, wingSpan * 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.2]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial
            color={trimColor}
            emissive={trimColor}
            emissiveIntensity={2.2}
          />
        </mesh>
      ))}

      {/* Drone-Specific Gimbal Sensor Camera */}
      {kind === 'drone' && (
        <mesh position={[0, -0.09, -0.28]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#1a202c" metalness={0.8} />
        </mesh>
      )}
    </group>
  )
}

// Military Helicopter (Rotary Wing)
function HelicopterModel({ faction }: { faction: 'BLUE' | 'RED' | 'NEUTRAL' }) {
  const isRed = faction === 'RED'
  const isBlue = faction === 'BLUE'
  const hullColor = isRed ? REAL_PALETTE.redHull : isBlue ? REAL_PALETTE.blueHull : REAL_PALETTE.neutralHull
  const trimColor = isRed ? REAL_PALETTE.redTrim : isBlue ? REAL_PALETTE.blueTrim : REAL_PALETTE.neutralTrim

  const rotor = useRef<THREE.Group>(null)
  const tailRotor = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.y += delta * 18
    if (tailRotor.current) tailRotor.current.rotation.x += delta * 24
  })

  return (
    <group>
      {/* Fuselage Cabin */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.5, 6, 8]} />
        <meshStandardMaterial color={hullColor} metalness={0.55} roughness={0.45} />
      </mesh>

      {/* Canopy */}
      <mesh position={[0, 0.05, -0.32]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial
          color="#a5d8ff"
          roughness={0.15}
          metalness={0.8}
          emissive="#38bdf8"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Tail Boom */}
      <mesh position={[0, 0.03, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 0.72, 6]} />
        <meshStandardMaterial color={hullColor} metalness={0.5} />
      </mesh>

      {/* Faction Marking on Tail */}
      <mesh position={[0, 0.12, 0.75]}>
        <boxGeometry args={[0.04, 0.14, 0.18]} />
        <meshStandardMaterial color={trimColor} emissive={trimColor} emissiveIntensity={0.5} />
      </mesh>

      {/* Main Rotor Blades */}
      <group ref={rotor} position={[0, 0.25, -0.05]}>
        <mesh>
          <boxGeometry args={[1.75, 0.02, 0.09]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.75, 0.02, 0.09]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Tail Rotor */}
      <group ref={tailRotor} position={[0.07, 0.12, 0.88]}>
        <mesh>
          <boxGeometry args={[0.02, 0.34, 0.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Landing Gear Skids */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.45]} />
        <meshStandardMaterial color="#1e242b" />
      </mesh>
    </group>
  )
}

// Armored Combat Vehicle & Mobile Command HQ
function GroundVehicleModel({
  command,
  faction,
}: {
  command: boolean
  faction: 'BLUE' | 'RED' | 'NEUTRAL'
}) {
  const isRed = faction === 'RED'
  const isBlue = faction === 'BLUE'
  const hullColor = isRed ? REAL_PALETTE.redHull : isBlue ? REAL_PALETTE.blueHull : REAL_PALETTE.neutralHull
  const trimColor = isRed ? REAL_PALETTE.redTrim : isBlue ? REAL_PALETTE.blueTrim : REAL_PALETTE.neutralTrim

  return (
    <group position={[0, 0.14, 0]}>
      {/* Armored Hull Chassis */}
      <mesh castShadow position={[0, 0.07, 0]}>
        <boxGeometry args={[0.68, 0.22, 0.46]} />
        <meshStandardMaterial color={hullColor} metalness={0.6} roughness={0.45} />
      </mesh>

      {/* Turret Assembly */}
      <mesh position={[0, 0.24, -0.02]} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.35]} />
        <meshStandardMaterial color={hullColor} metalness={0.65} roughness={0.4} />
      </mesh>

      {/* Faction ID Badge Plate */}
      <mesh position={[0, 0.22, 0.17]}>
        <boxGeometry args={[0.25, 0.06, 0.02]} />
        <meshStandardMaterial color={trimColor} emissive={trimColor} emissiveIntensity={0.8} />
      </mesh>

      {/* Cannon / Antennas */}
      {command ? (
        <group position={[0, 0.3, 0]}>
          <mesh position={[0.1, 0.24, 0.06]}>
            <cylinderGeometry args={[0.01, 0.015, 0.48, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[-0.1, 0.18, 0.06]}>
            <cylinderGeometry args={[0.01, 0.015, 0.36, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 0.24, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.03, 0.38, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      )}

      {/* All-Terrain Road Wheels / Tracks */}
      {[-1, 1].flatMap(side =>
        [-0.18, 0, 0.18].map((zOffset, idx) => (
          <mesh
            key={`${side}-${idx}`}
            position={[side * 0.36, 0.03, zOffset]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
            <meshStandardMaterial color="#181e24" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  )
}

// Tactical Radar Installation
function RadarModel({ faction }: { faction: 'BLUE' | 'RED' | 'NEUTRAL' }) {
  const isRed = faction === 'RED'
  const isBlue = faction === 'BLUE'
  const hullColor = isRed ? REAL_PALETTE.redHull : isBlue ? REAL_PALETTE.blueHull : REAL_PALETTE.neutralHull
  const trimColor = isRed ? REAL_PALETTE.redTrim : isBlue ? REAL_PALETTE.blueTrim : REAL_PALETTE.neutralTrim

  const dishRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (dishRef.current) dishRef.current.rotation.y += delta * 0.9
  })

  return (
    <group position={[0, 0.08, 0]}>
      {/* Fortified Base */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.58, 0.2, 8]} />
        <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Mast */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.6, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>

      {/* Rotating Phased Array Dish */}
      <group ref={dishRef} position={[0, 0.84, 0]}>
        <mesh position={[0, 0, -0.1]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.62, 0.32, 0.07]} />
          <meshStandardMaterial
            color={hullColor}
            metalness={0.7}
            roughness={0.3}
            emissive={trimColor}
            emissiveIntensity={0.35}
          />
        </mesh>
      </group>

      {/* Range Pulse Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.8, 1.84, 48]} />
        <meshBasicMaterial color={trimColor} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Strike Missile
function MissileModel() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.65, 8]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.8}
          roughness={0.2}
          emissive="#f97316"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.06, 0.18, 8]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} />
      </mesh>
      {/* Thruster Flame Point */}
      <mesh position={[0, -0.35, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#ff903b" emissive="#ff903b" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// TACTICAL OBJECTIVE MARKERS (VIBRANT RECOGNIZABLE ZONES)
// ─────────────────────────────────────────────────────────────
function TacticalObjectiveMarker({
  id,
  position,
  name,
  state,
  selected,
  onSelect,
}: {
  id: string
  position: [number, number, number]
  name: string
  state: string
  selected: boolean
  onSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const isSecure = state === 'SECURE'
  const isContested = state === 'CONTESTED'
  const color = selected
    ? '#f59e0b'
    : isSecure
    ? '#10b981'
    : isContested
    ? '#ef4444'
    : '#0ea5e9'

  const ringRef = useRef<THREE.Mesh>(null)
  const chevronRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ringRef.current) ringRef.current.rotation.z = t * 0.5
    if (chevronRef.current) {
      chevronRef.current.position.y = 0.65 + Math.sin(t * 2.5) * 0.08
      chevronRef.current.rotation.y = t * 1.4
    }
  })

  // Keep marker locked to actual terrain elevation
  const surfaceY = heightAt(position[0], position[2])

  return (
    <group
      position={[position[0], surfaceY, position[2]]}
      onClick={e => {
        e.stopPropagation()
        onSelect(id)
      }}
      onPointerOver={e => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ground Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.5, 0.58, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Tactical Marker Diamond */}
      <group ref={chevronRef}>
        <mesh>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 1.8 : 1.0}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Vertical Light Beacon */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 1.4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.55 : 0.25} />
      </mesh>

      {/* Hover / Selected Label */}
      {(hovered || selected) && (
        <Html position={[0, 1.0, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className={`world-label ${selected ? 'selected' : ''}`}>
            <span style={{ fontWeight: 700 }}>{name}</span>
            <small style={{ display: 'block', fontSize: '8px', color, fontWeight: 700 }}>
              [{state}]
            </small>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// TACTICAL MOVEMENT ROUTE PATH
// ─────────────────────────────────────────────────────────────
function TacticalRoute({ unit }: { unit: Entity }) {
  const isRed = unit.faction === 'RED'
  const isDestroyed = unit.status.toUpperCase().includes('DESTROYED') || (unit.strength ?? 100) <= 0
  if (isDestroyed) return null

  const isAir = ['drone', 'fighter', 'interceptor', 'missile', 'helicopter'].includes(unit.type)

  const line = useMemo(() => {
    // Elevate air routes or conform ground routes to terrain
    const points = unit.route.map(p => {
      const y = isAir ? p[1] : heightAt(p[0], p[2]) + 0.12
      return new THREE.Vector3(p[0], y, p[2])
    })
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const object = new THREE.Line(
      geometry,
      new THREE.LineDashedMaterial({
        color: isRed ? '#ef4444' : '#0ea5e9',
        dashSize: 0.2,
        gapSize: 0.12,
        transparent: true,
        opacity: 0.75,
      })
    )
    object.computeLineDistances()
    return object
  }, [unit.route, unit.faction, isRed, isAir])

  useFrame(({ clock }) => {
    ;(line.material as THREE.LineDashedMaterial).dashSize =
      0.16 + Math.sin(clock.elapsedTime * 1.8) * 0.04
  })

  return <primitive object={line} />
}

// ─────────────────────────────────────────────────────────────
// SIMULATION UNIT WRAPPER (CORRECT TERRAIN CONFORMING)
// ─────────────────────────────────────────────────────────────
function SimUnit({
  unit,
  selected,
  onSelect,
}: {
  unit: Entity
  selected: boolean
  onSelect: (id: string) => void
}) {
  const node = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const scratch = useMemo(() => new THREE.Vector3(), [])
  const targetRotation = useMemo(() => new THREE.Quaternion(), [])
  const isDestroyed = unit.status.toUpperCase().includes('DESTROYED') || (unit.strength ?? 100) <= 0

  const isAir = ['drone', 'fighter', 'interceptor', 'missile', 'helicopter'].includes(unit.type)

  // Compute realistic Y position: air units fly at altitude, ground units hug terrain
  const getY = (x: number, z: number, defaultY: number) => {
    if (isAir) return defaultY
    return heightAt(x, z) + 0.05
  }

  useEffect(() => {
    if (node.current) {
      const posY = getY(unit.position[0], unit.position[2], unit.position[1])
      node.current.position.set(unit.position[0], posY, unit.position[2])
    }
  }, [])

  useFrame((_, delta) => {
    if (!node.current) return
    const posY = getY(unit.position[0], unit.position[2], unit.position[1])
    const followSpeed = isDestroyed ? 2 : 6
    const follow = 1 - Math.exp(-followSpeed * delta)
    scratch.set(unit.position[0], posY, unit.position[2])
    node.current.position.lerp(scratch, follow)

    if (!isDestroyed && unit.route.length > 1) {
      const dx = unit.velocity[0] || (unit.route[1][0] - unit.route[0][0])
      const dz = unit.velocity[2] || (unit.route[1][2] - unit.route[0][2])
      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const yaw = Math.atan2(dx, dz)
        targetRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
        node.current.quaternion.slerp(targetRotation, 1 - Math.exp(-6 * delta))
      }
      if (['drone', 'fighter', 'interceptor'].includes(unit.type)) {
        node.current.rotation.z = THREE.MathUtils.damp(
          node.current.rotation.z,
          THREE.MathUtils.clamp(-dx * 0.06, -0.2, 0.2),
          4,
          delta
        )
      }
    }
  })

  const renderModel = () => {
    if (isDestroyed) {
      return <DestroyedWreckage />
    }
    switch (unit.type) {
      case 'drone':
      case 'fighter':
      case 'interceptor':
        return <AircraftModel kind={unit.type} faction={unit.faction} />
      case 'helicopter':
        return <HelicopterModel faction={unit.faction} />
      case 'vehicle':
      case 'command':
        return <GroundVehicleModel command={unit.type === 'command'} faction={unit.faction} />
      case 'radar':
        return <RadarModel faction={unit.faction} />
      case 'missile':
        return <MissileModel />
      default:
        return <GroundVehicleModel command={false} faction={unit.faction} />
    }
  }

  const badgeColor = unit.faction === 'RED' ? REAL_PALETTE.redTrim : REAL_PALETTE.blueTrim

  return (
    <group
      ref={node}
      onClick={e => {
        e.stopPropagation()
        onSelect(unit.id)
      }}
      onPointerOver={e => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Unit 3D Model */}
      {renderModel()}

      {/* Selected Tactical Selection Reticle */}
      {selected && (
        <group position={[0, -0.04, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.62, 24]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.84, 4]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Non-intrusive Hover Tooltip */}
      {(hovered || selected) && (
        <Html position={[0, 0.75, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className={`world-label ${selected ? 'selected' : ''}`}>
            <span style={{ color: badgeColor, fontWeight: 700 }}>{unit.id}</span>
            <span style={{ opacity: 0.9 }}> · {unit.status}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// CAMERA RIG
// ─────────────────────────────────────────────────────────────
function CameraRig({
  cameraMode: mode,
  selected,
  units,
  objectives,
}: Pick<Props, 'cameraMode' | 'selected' | 'units' | 'objectives'>) {
  const { camera } = useThree()
  const focus = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    let subject: [number, number, number] = [0, 0.4, 0]
    const unit = units.find(item => item.id === selected)
    const objective = objectives.find(item => item.id === selected) ?? objectives[0]

    if ((mode === 'follow' || mode === 'aircraft') && unit) subject = unit.position
    if (mode === 'objective' && objective) subject = objective.position
    if (mode === 'terrain' || mode === 'tactical') subject = [0, 0.2, 0]
    if (mode === 'overview') return

    focus.set(...subject)
    if (mode === 'tactical') {
      camera.up.set(0, 0, -1)
    } else {
      camera.up.set(0, 1, 0)
    }

    const offset =
      mode === 'aircraft'
        ? [0, 1.4, 3.6]
        : mode === 'tactical'
        ? [0, 20, 0.01]
        : mode === 'terrain'
        ? [0, 9, 14]
        : mode === 'objective'
        ? [4, 3.2, 5]
        : [0, 5, 8]

    desired.set(focus.x + offset[0], focus.y + offset[1], focus.z + offset[2])
    const ease = 1 - Math.exp(-2.5 * delta)
    camera.position.lerp(desired, ease)
    camera.lookAt(focus)
  })

  return null
}

// ─────────────────────────────────────────────────────────────
// COMBAT IMPACT FLASH & PARTICLES
// ─────────────────────────────────────────────────────────────
function ImpactEffect({
  event,
  simulationTime,
}: {
  event: SimulationEvent
  simulationTime: number
}) {
  const particles = useRef<Array<THREE.Mesh | null>>([])
  const flash = useRef<THREE.PointLight>(null)
  const age = simulationTime - event.simulationTime
  const visible = age >= 0 && age < 2.2

  const velocities = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2
        return new THREE.Vector3(
          Math.cos(angle) * (0.4 + (index % 3) * 0.15),
          ((index % 4) - 1.2) * 0.25,
          Math.sin(angle) * (0.4 + (index % 2) * 0.15)
        )
      }),
    []
  )

  useFrame(() => {
    if (flash.current) {
      flash.current.intensity = Math.max(0, (1 - age / 0.6) * 5)
    }
    particles.current.forEach((particle, index) => {
      if (!particle) return
      particle.visible = visible
      if (visible) {
        particle.position
          .copy(velocities[index])
          .multiplyScalar(age * 1.6)
          .add(new THREE.Vector3(...(event.position ?? [0, 0, 0])))
        const scale = Math.max(0.02, (1 - age / 2.2) * 0.16)
        particle.scale.setScalar(scale)
      }
    })
  })

  return (
    <group position={event.position ?? [0, 0, 0]}>
      <pointLight ref={flash} color="#fbbf24" distance={8} decay={2} />
      {velocities.map((_, index) => (
        <mesh
          key={index}
          ref={el => {
            particles.current[index] = el
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? '#ea580c' : '#facc15'}
            transparent
            opacity={Math.max(0, 1 - age / 2.2)}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN 3D SCENE (WARM SUNLIT THEATER)
// ─────────────────────────────────────────────────────────────
function Scene({
  units,
  objectives,
  events,
  simulationTime,
  selected,
  onSelect,
  layers,
  cameraMode,
}: Props) {
  return (
    <>
      {/* Sky & Atmosphere */}
      <color attach="background" args={['#87ceeb']} />
      <Sky
        distance={450000}
        sunPosition={[-8, 16, -10]}
        inclination={0.52}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.6}
        turbidity={8}
      />
      <fog attach="fog" args={['#9ecae1', 25, 65]} />

      {/* Natural Warm Sun & Ambient Lighting */}
      <ambientLight intensity={0.85} color="#e0f2fe" />
      <hemisphereLight args={['#bae6fd', '#475e3a', 0.9]} />
      <directionalLight
        castShadow
        position={[-12, 22, -10]}
        intensity={2.2}
        color="#fffbeb"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      {/* Soft Fill Light */}
      <directionalLight position={[10, 12, 10]} intensity={0.6} color="#dbeafe" />

      {/* Terrain Environment */}
      {layers.terrain && <Ground showInfrastructure={layers.infrastructure} />}

      {/* Routes & Movement Vectors */}
      {layers.routes &&
        units
          .filter(u => u.route.length > 1)
          .map(u => <TacticalRoute key={u.id} unit={u} />)}

      {/* Objectives */}
      {layers.objectives &&
        objectives.map(o => (
          <TacticalObjectiveMarker
            key={o.id}
            id={o.id}
            position={[o.position[0], o.position[1], o.position[2]]}
            name={o.name}
            state={o.state}
            selected={selected === o.id}
            onSelect={onSelect}
          />
        ))}

      {/* Active Units */}
      {layers.units &&
        units
          .filter(unit => layers.radar || unit.type !== 'radar')
          .map(unit => (
            <SimUnit
              key={unit.id}
              unit={unit}
              selected={selected === unit.id}
              onSelect={onSelect}
            />
          ))}

      {/* Dynamic Impact & Combat Effects */}
      {events
        .filter(event => (event.type === 'intercept' || event.type === 'launch') && event.position)
        .map(event => (
          <ImpactEffect
            key={event.id}
            event={event}
            simulationTime={simulationTime}
          />
        ))}

      {/* Shadows for Grounded Tactical Units */}
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.55}
        scale={30}
        blur={2.0}
        far={6}
        color="#1e293b"
      />

      {/* Interactive Controls & Camera Rig */}
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI * 0.46}
        minPolarAngle={0.15}
        enableDamping
        dampingFactor={0.08}
      />
      <CameraRig
        cameraMode={cameraMode}
        selected={selected}
        units={units}
        objectives={objectives}
      />

      {/* Subtle Bloom for Lasers, Tracers & Beacons */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

export default function SimulationWorld(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [11, 10, 13], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  )
}

