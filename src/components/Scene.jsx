import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float, Icosahedron } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'

export function Scene() {
    return (
        <>
            <ambientLight intensity={1} color="#82afc4" />
            <directionalLight position={[10, 10, 5]} intensity={2} color="#e0f2fe" />

            <ParticleField />

            <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
                <group scale={1.2}>
                    <TechCore />
                </group>
            </Float>
        </>
    )
}

function ParticleField(props) {
    const ref = useRef()
    const sphere = random.inSphere(new Float32Array(4000), { radius: 14 })

    useFrame((state, delta) => {
        ref.current.rotation.x -= delta / 15
        ref.current.rotation.y -= delta / 20
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#bae6fd" // Light Sky Blue
                    size={0.02}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.6}
                />
            </Points>
        </group>
    )
}

function TechCore() {
    return (
        <group>
            {/* Outer Wireframe - Pure White Scaffolding */}
            <Icosahedron args={[1.3, 0]}>
                <meshBasicMaterial wireframe color="#ffffff" transparent opacity={0.3} />
            </Icosahedron>

            {/* Inner Core - Glowing Cyan-Blue */}
            <Icosahedron args={[0.9, 1]}>
                <meshStandardMaterial
                    color="#0077ff"
                    roughness={0.1}
                    metalness={1}
                    wireframe={true}
                    emissive="#00e1ff"
                    emissiveIntensity={2}
                />
            </Icosahedron>
        </group>
    )
}
