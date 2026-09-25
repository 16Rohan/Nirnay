import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, Sky, Trail } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Entity, SimulationEvent, SimulationObjective } from '../../../../contracts/simulation_3d'

export type CameraMode = 'overview' | 'follow' | 'aircraft' | 'terrain' | 'objective' | 'tactical'
type Props = { units: Entity[]; objectives: SimulationObjective[]; events: SimulationEvent[]; simulationTime: number; selected: string | null; onSelect: (id: string) => void; layers: Record<string, boolean>; cameraMode: CameraMode }
const heightAt = (x: number, z: number) => .09 + Math.sin(x * .48) * .22 + Math.cos(z * .37) * .2 + Math.sin((x + z) * .31) * .11

function Ground({ showInfrastructure }: { showInfrastructure: boolean }) {
  const terrain = useMemo(() => {
    const g = new THREE.PlaneGeometry(18, 14, 120, 96); g.rotateX(-Math.PI / 2)
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)))
    g.computeVertexNormals(); return g
  }, [])
  const river = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-8, .08, -4), new THREE.Vector3(-4, .09, -2.5), new THREE.Vector3(-1.5, .09, -.8), new THREE.Vector3(1, .08, -.4), new THREE.Vector3(4, .08, 1.8), new THREE.Vector3(8, .08, 3.2)]), [])
  const road = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-8, .08, 4), new THREE.Vector3(-5, .32, 3), new THREE.Vector3(-2, .34, 1), new THREE.Vector3(0, .2, -1.4), new THREE.Vector3(2, .28, -2.3), new THREE.Vector3(5, .4, -3.6), new THREE.Vector3(8, .25, -4.2)]), [])
  return <>
    <mesh geometry={terrain} receiveShadow><meshStandardMaterial color="#465345" roughness={.97} /></mesh>
    <mesh position={[0, -.18, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#17242a" roughness={1} /></mesh>
    {[-7.3, -6.1, -4.8, 5.8, 7.1].map((x, i) => <mesh key={i} position={[x, 1.4 + (i % 2) * .5, -1 + i * .5]} scale={[2.5, 2.4 + (i % 2), 3]} castShadow><coneGeometry args={[1, 3, 7]} /><meshStandardMaterial color={i % 2 ? '#394640' : '#4e5549'} roughness={1} flatShading /></mesh>)}
    <mesh position={[0, .045, 0]}><tubeGeometry args={[river, 100, .22, 8, false]} /><meshStandardMaterial color="#376879" roughness={.3} metalness={.15} emissive="#143b49" emissiveIntensity={.25} /></mesh>
    <group visible={showInfrastructure}>
      <mesh position={[0, .13, 0]}><tubeGeometry args={[road, 100, .13, 7, false]} /><meshStandardMaterial color="#888477" roughness={1} /></mesh>
      <mesh position={[.1, .24, -.7]} rotation={[0, .65, 0]}><boxGeometry args={[1.35, .1, .4]} /><meshStandardMaterial color="#77776e" roughness={.9} /></mesh>
      {Array.from({ length: 58 }, (_, i) => { const x = ((i * 37) % 160) / 10 - 8, z = ((i * 61) % 120) / 10 - 6; if (Math.abs(x + z * .25) < 1.2) return null; return <mesh key={i} position={[x, heightAt(x, z) + .19, z]} scale={[.14, .18 + (i % 4) * .025, .14]} castShadow><coneGeometry args={[1, 1.7, 6]} /><meshStandardMaterial color={i % 3 === 0 ? '#53634b' : '#3c5748'} roughness={1} /></mesh> })}
      {Array.from({ length: 9 }, (_, i) => <group key={i} position={[-3 + (i % 3) * .45, heightAt(-3, -4) + .13, -4 + Math.floor(i / 3) * .42]}><mesh castShadow><boxGeometry args={[.3, .25, .3]} /><meshStandardMaterial color="#777469" roughness={.9} /></mesh><mesh position={[0, .19, 0]}><coneGeometry args={[.24, .19, 4]} /><meshStandardMaterial color="#574e40" roughness={1} /></mesh></group>)}
    </group>
  </>
}

function Aircraft({ kind, color }: { kind: 'drone' | 'fighter' | 'interceptor'; color: string }) {
  const wing = kind === 'drone' ? 1.35 : kind === 'interceptor' ? .72 : 1
  return <group>
    <mesh castShadow><capsuleGeometry args={[.095, kind === 'drone' ? .85 : .62, 5, 8]} /><meshStandardMaterial color={color} metalness={.6} roughness={.42} /></mesh>
    <mesh position={[0, 0, .05]} rotation={[0, 0, Math.PI / 2]} castShadow><coneGeometry args={[.18, wing * 1.8, 4]} /><meshStandardMaterial color={color} metalness={.55} roughness={.45} /></mesh>
    <mesh position={[0, .13, -.12]}><sphereGeometry args={[.12, 10, 8]} /><meshPhysicalMaterial color="#65b5c6" roughness={.16} metalness={.25} transparent opacity={.82} /></mesh>
    <mesh position={[0, .02, .59]}><coneGeometry args={[.05, .25, 8]} /><meshStandardMaterial color="#283843" metalness={.8} /></mesh>
    {[-.56, .56].map(x => <mesh key={x} position={[x, .02, .35]}><sphereGeometry args={[.035, 8, 8]} /><meshBasicMaterial color="#49c9ff" /></mesh>)}
    {kind === 'drone' && <><mesh position={[-.55, 0, .62]}><cylinderGeometry args={[.04, .04, .22, 8]} /><meshStandardMaterial color="#252a2b" /></mesh><mesh position={[0, -.11, -.08]}><sphereGeometry args={[.09, 8, 8]} /><meshStandardMaterial color="#141a1d" /></mesh></>}
    {kind === 'fighter' && <><mesh position={[-.23, -.1, .48]}><cylinderGeometry args={[.055, .055, .2, 8]} /><meshStandardMaterial color="#25282a" /></mesh><mesh position={[.23, -.1, .48]}><cylinderGeometry args={[.055, .055, .2, 8]} /><meshStandardMaterial color="#25282a" /></mesh></>}
  </group>
}

function Helicopter() {
  const rotor = useRef<THREE.Group>(null); const tail = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (rotor.current) rotor.current.rotation.y += d * 13; if (tail.current) tail.current.rotation.x += d * 18 })
  return <group><mesh castShadow><capsuleGeometry args={[.17, .52, 5, 9]} /><meshStandardMaterial color="#52604f" metalness={.35} roughness={.7} /></mesh><mesh position={[0, .04, -.34]}><sphereGeometry args={[.15, 12, 8]} /><meshPhysicalMaterial color="#72b5c4" transparent opacity={.7} roughness={.2} /></mesh><mesh position={[0, 0, .52]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.045, .07, .72, 8]} /><meshStandardMaterial color="#39463f" /></mesh><group ref={rotor} position={[0, .24, 0]}><mesh><boxGeometry args={[1.65, .025, .12]} /><meshStandardMaterial color="#252d2d" /></mesh><mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[1.65, .025, .12]} /><meshStandardMaterial color="#252d2d" /></mesh></group><group ref={tail} position={[0, .08, .82]}><mesh><boxGeometry args={[.36, .025, .05]} /><meshStandardMaterial color="#242a2a" /></mesh></group><mesh position={[0, -.23, 0]}><boxGeometry args={[.6, .035, .48]} /><meshStandardMaterial color="#353d3b" /></mesh></group>
}

function Vehicle({ command }: { command: boolean }) {
  return <group><mesh position={[0, .22, 0]} castShadow><boxGeometry args={[.72, .34, .43]} /><meshStandardMaterial color={command ? '#354950' : '#4a5349'} metalness={.25} roughness={.78} /></mesh><mesh position={[0, .42, -.03]}><boxGeometry args={[.4, .16, .37]} /><meshStandardMaterial color="#46534d" roughness={.8} /></mesh>{[-1, 1].flatMap(s => [-1, 1, 0].map((n, i) => <mesh key={`${s}-${i}`} position={[s * .38, .13, (i - 1) * .25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.105, .105, .06, 12]} /><meshStandardMaterial color="#171b1a" roughness={1} /></mesh>))}{command && <><mesh position={[.05, .72, .06]}><cylinderGeometry args={[.012, .02, .58, 6]} /><meshStandardMaterial color="#6d8583" /></mesh><mesh position={[-.12, .64, .04]}><cylinderGeometry args={[.012, .02, .4, 6]} /><meshStandardMaterial color="#6d8583" /></mesh></>}</group>
}

function MissileModel() {
  return <group rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow><cylinderGeometry args={[.055, .055, .64, 10]} /><meshStandardMaterial color="#8d877a" metalness={.7} roughness={.35} emissive="#ff8e53" emissiveIntensity={.5} /></mesh>
    <mesh position={[0, .29, 0]}><coneGeometry args={[.07, .18, 8]} /><meshStandardMaterial color="#d7d0bb" metalness={.7} /></mesh>
    <Trail width={.12} length={7} color="#f3a16b" attenuation={width => width * width}><mesh position={[0, -.35, 0]}><sphereGeometry args={[.035, 8, 8]} /><meshBasicMaterial color="#ffb27b" /></mesh></Trail>
  </group>
}

function Radar() { const arm = useRef<THREE.Group>(null); useFrame((_, d) => { if (arm.current) arm.current.rotation.y += d * .75 }); return <group><mesh position={[0, .1, 0]}><cylinderGeometry args={[.42, .52, .18, 12]} /><meshStandardMaterial color="#48544e" roughness={.8} /></mesh><mesh position={[0, .55, 0]}><cylinderGeometry args={[.08, .12, .78, 10]} /><meshStandardMaterial color="#7a8278" metalness={.4} /></mesh><group ref={arm} position={[0, .96, 0]}><mesh position={[0, 0, -.13]}><boxGeometry args={[.52, .26, .08]} /><meshStandardMaterial color="#536663" metalness={.55} roughness={.4} emissive="#1b7482" emissiveIntensity={.25} /></mesh></group><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .04, 0]}><ringGeometry args={[1.55, 1.59, 64]} /><meshBasicMaterial color="#55d7ef" transparent opacity={.24} side={THREE.DoubleSide} /></mesh></group> }

function Marker({ id, position, label, selected, onSelect }: { id: string; position: [number, number, number]; label: string; selected: boolean; onSelect: (id: string) => void }) { return <group position={position} onClick={e => { e.stopPropagation(); onSelect(id) }}><mesh><cylinderGeometry args={[.035, .035, .45, 8]} /><meshBasicMaterial color={selected ? '#ffb347' : '#5bdfff'} transparent opacity={.75} /></mesh><mesh position={[0, .28, 0]}><sphereGeometry args={[.11, 12, 12]} /><meshBasicMaterial color={selected ? '#ffb347' : '#6be4fa'} /></mesh><Html position={[0, .5, 0]} center distanceFactor={13} style={{ pointerEvents: 'none' }}><span className="world-label">{label}</span></Html></group> }

function Route({ unit }: { unit: Entity }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(unit.route.map(p => new THREE.Vector3(...p)))
    const object = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: unit.faction === 'RED' ? '#ff6574' : '#55d7ff', dashSize: .15, gapSize: .12, transparent: true, opacity: .56 }))
    object.computeLineDistances()
    return object
  }, [unit.route, unit.faction])
  useFrame(({ clock }) => { (line.material as THREE.LineDashedMaterial).dashSize = .12 + Math.sin(clock.elapsedTime * 1.4) * .025 })
  return <primitive object={line} />
}

function SimUnit({ unit, selected, onSelect }: { unit: Entity; selected: boolean; onSelect: (id: string) => void }) {
  const node = useRef<THREE.Group>(null)
  const scratch = useMemo(() => new THREE.Vector3(), [])
  const targetRotation = useMemo(() => new THREE.Quaternion(), [])
  useEffect(() => { if (node.current) node.current.position.set(...unit.position) }, [])
  useFrame((_, delta) => {
    if (!node.current) return
    const follow = 1 - Math.exp(-5 * delta)
    scratch.set(...unit.position)
    node.current.position.lerp(scratch, follow)
    if (unit.route.length > 1) {
      const dx = unit.route[1][0] - unit.route[0][0], dz = unit.route[1][2] - unit.route[0][2]
      const yaw = Math.atan2(-dx, -dz)
      targetRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
      node.current.quaternion.slerp(targetRotation, 1 - Math.exp(-4 * delta))
      if (['drone', 'fighter', 'interceptor'].includes(unit.type)) node.current.rotation.z = THREE.MathUtils.damp(node.current.rotation.z, THREE.MathUtils.clamp(-dx * .035, -.12, .12), 3, delta)
    }
  })
  return <group ref={node} onClick={e => { e.stopPropagation(); onSelect(unit.id) }}>
    {unit.type === 'drone' || unit.type === 'fighter' || unit.type === 'interceptor' ? <Aircraft kind={unit.type} color={unit.faction === 'RED' ? '#5b4142' : '#626b69'} /> : unit.type === 'helicopter' ? <Helicopter /> : unit.type === 'vehicle' || unit.type === 'command' ? <Vehicle command={unit.type === 'command'} /> : unit.type === 'radar' ? <Radar /> : <MissileModel />}
    {selected && <Html position={[0, .7, 0]} center distanceFactor={13} style={{ pointerEvents: 'none' }}><span className="world-label selected">{unit.id} · {unit.status}</span></Html>}
  </group>
}

function CameraRig({ cameraMode: mode, selected, units, objectives }: Pick<Props, 'cameraMode' | 'selected' | 'units' | 'objectives'>) {
  const { camera } = useThree()
  const focus = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, delta) => {
    let subject: [number, number, number] = [0, .4, 0]
    const unit = units.find(item => item.id === selected)
    const objective = objectives.find(item => item.id === selected) ?? objectives[0]
    if ((mode === 'follow' || mode === 'aircraft') && unit) subject = unit.position
    if (mode === 'objective' && objective) subject = objective.position
    if (mode === 'terrain' || mode === 'tactical') subject = [0, .2, 0]
    if (mode === 'overview') return
    focus.set(...subject)
    if (mode === 'tactical') camera.up.set(0, 0, -1)
    else camera.up.set(0, 1, 0)
    const offset = mode === 'aircraft' ? [0, 1.35, 3.4] : mode === 'tactical' ? [0, 17, .01] : mode === 'terrain' ? [0, 9, 13] : mode === 'objective' ? [4, 3.2, 5] : [0, 4.2, 7]
    desired.set(focus.x + offset[0], focus.y + offset[1], focus.z + offset[2])
    const ease = 1 - Math.exp(-2.5 * delta)
    camera.position.lerp(desired, ease)
    camera.lookAt(focus)
  })
  return null
}

function ImpactEffect({ event, simulationTime }: { event: SimulationEvent; simulationTime: number }) {
  const particles = useRef<Array<THREE.Mesh | null>>([])
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const velocities = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const angle = index / 14 * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * (.3 + (index % 3) * .12), ((index % 4) - 1.5) * .16, Math.sin(angle) * (.3 + (index % 2) * .16))
  }), [])
  useFrame(() => {
    const age = simulationTime - event.simulationTime
    const visible = age >= 0 && age < 2.4
    particles.current.forEach((particle, index) => {
      if (!particle) return
      particle.visible = visible
      if (visible) {
        particle.position.copy(velocities[index]).multiplyScalar(age).add(new THREE.Vector3(...(event.position ?? [0, 0, 0])))
        const scale = Math.max(.03, (1 - age / 2.4) * .13)
        particle.scale.setScalar(scale)
      }
    })
    if (material.current) material.current.opacity = Math.max(0, 1 - age / 2.4)
  })
  return <group>{velocities.map((_, index) => <mesh key={index} ref={el => { particles.current[index] = el }} visible={false}><sphereGeometry args={[1, 6, 6]} /><meshBasicMaterial ref={index === 0 ? material : undefined} color={index % 2 ? '#68ddf5' : '#ffb15f'} transparent depthWrite={false} /></mesh>)}</group>
}

function Scene({ units, objectives, events, simulationTime, selected, onSelect, layers, cameraMode }: Props) {
  return <>
    <color attach="background" args={['#09141a']} /><fog attach="fog" args={['#09141a', 12, 31]} />
    <Sky distance={450000} sunPosition={[-2, .18, -5]} inclination={.49} azimuth={.23} />
    <ambientLight intensity={.85} /><hemisphereLight args={['#8db8cc', '#292e25', 1.25]} /><directionalLight castShadow position={[-7, 12, -5]} intensity={2.3} color="#ffc98b" shadow-mapSize={[2048, 2048]} /><pointLight position={[4, 5, 4]} intensity={.8} color="#50bfe6" />
    {layers.terrain && <Ground showInfrastructure={layers.infrastructure} />}
    {layers.routes && units.filter(u => u.route.length > 1).map(u => <Route key={u.id} unit={u} />)}
    {layers.objectives && objectives.map(o => <Marker key={o.id} id={o.id} position={[o.position[0], o.position[1], o.position[2]]} label={o.name} selected={selected === o.id} onSelect={onSelect} />)}
    {layers.units && units.filter(unit => layers.radar || unit.type !== 'radar').map(unit => <SimUnit key={unit.id} unit={unit} selected={selected === unit.id} onSelect={onSelect} />)}
    {events.filter(event => event.type === 'intercept' && event.position).map(event => <ImpactEffect key={event.id} event={event} simulationTime={simulationTime} />)}
    <ContactShadows position={[0, -.03, 0]} opacity={.32} scale={22} blur={2.4} far={4} />
    <OrbitControls makeDefault target={[0, .5, 0]} minDistance={6} maxDistance={19} maxPolarAngle={Math.PI * .48} minPolarAngle={.25} enableDamping dampingFactor={.08} />
    <CameraRig cameraMode={cameraMode} selected={selected} units={units} objectives={objectives} />
    <EffectComposer multisampling={0}><Bloom intensity={.28} luminanceThreshold={.78} luminanceSmoothing={.16} mipmapBlur /></EffectComposer>
  </>
}

export default function SimulationWorld(props: Props) { return <Canvas shadows dpr={[1, 1.7]} camera={{ position: [10, 10, 12], fov: 42 }} gl={{ antialias: true, powerPreference: 'high-performance' }}><Suspense fallback={null}><Scene {...props} /></Suspense></Canvas> }
