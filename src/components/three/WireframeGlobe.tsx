import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import TerrainMesh from './TerrainMesh'

/**
 * WireframeGlobe — wraps the TerrainMesh in a standalone R3F canvas.
 * Used by the hero section as a floating 3D accent element.
 */
export default function WireframeGlobe() {
  return (
    <div className="w-full h-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 2.8, 5.5], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 4, 3]}   intensity={0.9} color="#42C7FF" />
        <pointLight position={[-2, -2, 2]} intensity={0.3} color="#168CFF" />
        <Suspense fallback={null}>
          <TerrainMesh />
        </Suspense>
      </Canvas>
    </div>
  )
}
