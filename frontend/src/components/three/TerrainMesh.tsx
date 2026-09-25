import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Shared tactical terrain mesh component.
 * Used by both WireframeGlobe and the geospatial section canvas.
 */
export default function TerrainMesh() {
  const groupRef    = useRef<THREE.Group>(null)
  const sweepRef    = useRef<THREE.Mesh>(null)
  const particleRef = useRef<THREE.Points>(null)

  /* ── Elevation grid ── */
  const terrain = useMemo(() => {
    const W = 40, H = 40
    const geo = new THREE.PlaneGeometry(6, 6, W - 1, H - 1)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      pos.setZ(i,
        Math.sin(x * 1.8) * 0.18 +
        Math.cos(y * 1.4) * 0.14 +
        Math.sin(x * 3.2 + y * 2.1) * 0.08 +
        Math.cos(x * 2.5 - y * 3.0) * 0.06
      )
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  /* ── Trajectory lines ── */
  const trajectories = useMemo(() => {
    const lines: THREE.Line[] = []
    const blueMat = new THREE.LineBasicMaterial({ color: '#42C7FF', transparent: true, opacity: 0.7 })
    const redMat  = new THREE.LineBasicMaterial({ color: '#FF5968', transparent: true, opacity: 0.65 })

    const bPts: THREE.Vector3[] = []
    for (let t = 0; t <= 1; t += 0.04) {
      bPts.push(new THREE.Vector3(-2.5 + t*3.5, -1.2 + t*1.8, 0.05 + Math.sin(t*Math.PI)*0.6))
    }
    lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(bPts), blueMat))

    const rPts: THREE.Vector3[] = []
    for (let t = 0; t <= 0.65; t += 0.04) {
      rPts.push(new THREE.Vector3(2.0 - t*2.8, 1.0 - t*2.2, 0.05 + Math.sin(t*Math.PI*0.8)*0.45))
    }
    lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rPts), redMat))
    return lines
  }, [])

  /* ── Markers ── */
  const markers: Array<{ pos: [number,number,number]; color: string }> = useMemo(() => [
    { pos: [-1.8, -0.8, 0.28], color: '#42C7FF' },
    { pos: [ 0.5,  1.0, 0.30], color: '#42C7FF' },
    { pos: [ 1.8, -1.4, 0.22], color: '#FF5968' },
    { pos: [-0.4,  1.6, 0.16], color: '#FF5968' },
    { pos: [ 0.0, -0.2, 0.36], color: '#42D99A' },
  ], [])

  /* ── Particles ── */
  const particles = useMemo(() => {
    const count = 200
    const pos   = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5)*7
      pos[i*3+1] = (Math.random()-0.5)*7
      pos[i*3+2] = Math.random()*1.2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current)  groupRef.current.rotation.z  = t * 0.04
    if (sweepRef.current)  sweepRef.current.rotation.z  = -t * 1.25
    if (particleRef.current) particleRef.current.rotation.z = t * 0.018
  })

  return (
    <group rotation={[-Math.PI / 2.8, 0, 0]} position={[0, -0.3, 0]}>
      {/* Dark terrain fill */}
      <mesh geometry={terrain}>
        <meshBasicMaterial color="#030810" transparent opacity={0.75} side={THREE.FrontSide} />
      </mesh>
      {/* Grid wireframe */}
      <mesh geometry={terrain}>
        <meshBasicMaterial color="#168CFF" wireframe transparent opacity={0.20} />
      </mesh>
      {/* Subtle second pass */}
      <mesh geometry={terrain}>
        <meshBasicMaterial color="#42C7FF" wireframe transparent opacity={0.05} />
      </mesh>

      {/* Trajectory lines */}
      {trajectories.map((l, i) => <primitive key={i} object={l} />)}

      {/* Marker nodes */}
      {markers.map(({ pos, color }, i) => (
        <group key={i} position={pos}>
          <mesh>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.13, 0.008, 6, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Radar */}
      <group ref={groupRef} position={[-0.4, 0.6, 0.07]}>
        <mesh><torusGeometry args={[0.55, 0.007, 6, 64]} /><meshBasicMaterial color="#42C7FF" transparent opacity={0.35} /></mesh>
        <mesh><torusGeometry args={[0.35, 0.004, 6, 64]} /><meshBasicMaterial color="#42C7FF" transparent opacity={0.18} /></mesh>
        <mesh ref={sweepRef}>
          <circleGeometry args={[0.55, 32, 0, Math.PI * 0.45]} />
          <meshBasicMaterial color="#168CFF" transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Particles */}
      <points ref={particleRef} geometry={particles}>
        <pointsMaterial color="#42C7FF" size={0.02} transparent opacity={0.4} sizeAttenuation />
      </points>
    </group>
  )
}
