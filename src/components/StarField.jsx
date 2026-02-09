import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Embedded shaders to fix the Vite resolution error and ensure stability
const vertexShader = `
  uniform float uTime;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aOffset;
  attribute vec3 aDrift;
  varying float vAlpha;
  
  void main() {
    // Slower, smoother drift
    vec3 animatedPos = position + (aDrift * uTime * 0.1);
    
    vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
    
    // Increased base size multiplier (from 200 to 250)
    float dist = length(mvPosition.xyz);
    gl_PointSize = aSize * (250.0 / max(dist, 1.0)); 
    
    gl_Position = projectionMatrix * mvPosition;

    // Smoother Twinkle: Reduced speed (x1.0 instead of x2.0)
    float twinkle = sin(uTime * aSpeed + aOffset);
    // Smoothstep ensures the transition at the peak/valley is less "linear" and more organic
    float blink = smoothstep(-1.0, 1.0, twinkle);
    vAlpha = 0.3 + 0.7 * blink; 
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    vec2 pt = gl_PointCoord - 0.5;
    float d = length(pt);
    if (d > 0.5) discard;
    
    // Softer falloff (reduced exponent from 10.0 to 6.0) for a slightly more ethereal feel
    float bloom = exp(-d * 6.0); 
    float core = smoothstep(0.25, 0.1, d); 
    
    float intensity = max(core, bloom * 0.5); 

    gl_FragColor = vec4(uColor, vAlpha * intensity);
  }
`;

export function StarField({ count = 1000 }) {
    const mesh = useRef()

    const particles = useMemo(() => {
        const safeCount = Number.isFinite(count) ? count : 0;
        const pos = new Float32Array(safeCount * 3)
        const sizes = new Float32Array(safeCount)
        const speeds = new Float32Array(safeCount)
        const offsets = new Float32Array(safeCount)
        const drift = new Float32Array(safeCount * 3)

        for (let i = 0; i < safeCount; i++) {
            // Wider spread: Increased max radius (from 120 to 180) to fill more screen area
            const r = 70 + Math.random() * 110
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            pos[i * 3 + 2] = r * Math.cos(phi)

            // Slightly larger sizes
            sizes[i] = 0.6 + Math.random() * 1.4

            // Slower speeds for "soft" blinking
            speeds[i] = 0.4 + Math.random() * 1.2
            offsets[i] = Math.random() * Math.PI * 2

            // Minimal drift
            drift[i * 3] = (Math.random() - 0.5) * 0.03
            drift[i * 3 + 1] = (Math.random() - 0.5) * 0.03
            drift[i * 3 + 2] = (Math.random() - 0.5) * 0.03
        }

        return { pos, sizes, speeds, offsets, drift }
    }, [count])

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#d1e8f4') }
    }), [])

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime()
            mesh.current.rotation.y += 0.00015
            mesh.current.rotation.z += 0.00008
        }
    })

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particles.pos.length / 3} array={particles.pos} itemSize={3} />
                <bufferAttribute attach="attributes-aSize" count={particles.sizes.length} array={particles.sizes} itemSize={1} />
                <bufferAttribute attach="attributes-aSpeed" count={particles.speeds.length} array={particles.speeds} itemSize={1} />
                <bufferAttribute attach="attributes-aOffset" count={particles.offsets.length} array={particles.offsets} itemSize={1} />
                <bufferAttribute attach="attributes-aDrift" count={particles.drift.length} array={particles.drift} itemSize={3} />
            </bufferGeometry>
            <shaderMaterial
                depthWrite={false}
                transparent
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
            />
        </points>
    )
}
