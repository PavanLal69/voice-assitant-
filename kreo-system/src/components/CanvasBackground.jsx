import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { globalScrollState } from '../App';
import { globalVoiceState } from '../hooks/useVoiceAI';

// Added new uniforms: uSpeaking (audio distortion level) and uListening (color/pulse state)
const KreoCoreMaterial = shaderMaterial(
    {
        uTime: 0,
        uProgress: 0,
        uVelocity: 0,
        uCollapse: 0,
        uNeural: 0,
        uDominion: 0,
        uListening: 0,
        uSpeaking: 0
    },
    // Vertex Shader
    `
  uniform float uTime;
  uniform float uProgress;
  uniform float uCollapse;
  uniform float uSpeaking;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  // Ashima 3D Noise function (Simplex)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    float baseFrequency = 1.5;
    // Voice heavily distorts speed
    float timeSpeed = 0.5 + (uCollapse * 3.0) + (uSpeaking * 2.5); 
    float strength = 0.2 + (uCollapse * 0.8) + (uProgress * 0.3) + (uSpeaking * 0.5); 
    
    vec3 noisePos = position * baseFrequency + vec3(uTime * timeSpeed);
    float noiseValue = snoise(noisePos);
    
    vec3 newPosition = position + normal * (noiseValue * strength);

    float baseScale = smoothstep(0.0, 0.15, uProgress); 
    float finalScale = mix(baseScale, 4.0, smoothstep(0.85, 1.0, uProgress));

    // KREO expands slightly when awaiting command
    if (uSpeaking > 0.0) {
        finalScale *= 1.1 + (sin(uTime * 15.0) * 0.05); // Rapid audio flutter scale
    }

    newPosition *= finalScale;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    vPosition = newPosition;
    
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
    // Fragment Shader
    `
  uniform float uTime;
  uniform float uProgress;
  uniform float uVelocity;
  uniform float uSpeaking;
  uniform float uListening;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;

  void main() {
    vec3 colorDark = vec3(0.02, 0.02, 0.02);
    vec3 colorSingularity = vec3(1.0, 1.0, 1.0);
    vec3 colorRaw = vec3(0.8, 0.1, 0.9); 
    vec3 colorAwake = vec3(0.0, 0.95, 1.0); 
    vec3 colorNeural = vec3(1.0, 0.0, 1.0); 
    
    // Custom Voice Interaction Colors
    vec3 colorListening = vec3(1.0, 0.0, 1.0); // Bright Magenta when capturing command
    vec3 colorSpeaking = vec3(0.0, 1.0, 0.8);  // Electric Mint when speaking back

    vec3 baseColor = colorDark;
    
    if (uProgress < 0.15) {
      baseColor = mix(colorDark, colorSingularity, uProgress / 0.15);
    } else if (uProgress < 0.3) {
      baseColor = mix(colorSingularity, colorRaw, (uProgress - 0.15) / 0.15);
    } else if (uProgress < 0.6) {
      baseColor = mix(colorRaw, colorAwake, (uProgress - 0.3) / 0.3);
    } else {
      baseColor = mix(colorAwake, colorNeural, (uProgress - 0.6) / 0.4);
    }

    // Voice overrides the narrative color when active
    if (uListening > 0.0) {
        baseColor = mix(baseColor, colorListening, uListening);
    } else if (uSpeaking > 0.0) {
        baseColor = mix(baseColor, colorSpeaking, uSpeaking);
    }

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float fresnelFactor = dot(normal, viewDir);
    fresnelFactor = clamp(1.0 - fresnelFactor, 0.0, 1.0);
    fresnelFactor = pow(fresnelFactor, 3.0);

    float energyPulse = sin(uTime * 10.0) * 0.5 + 0.5;
    vec3 finalGlow = baseColor * (1.0 + fresnelFactor * 2.0);
    
    // Voice speaking amps up the pulse violently
    float speakingPulse = sin(uTime * 20.0) * 0.5 + 0.5;
    finalGlow += baseColor * energyPulse * abs(uVelocity) * 2.0;
    finalGlow += baseColor * speakingPulse * uSpeaking * 3.0; // intense glow

    float coreIntensity = smoothstep(0.8, 0.0, length(vPosition));
    finalGlow += baseColor * coreIntensity * 0.5;

    float alpha = 1.0;
    // We removed the dissolve logic so KREO stays solid as a voice assistant at the end.
    
    gl_FragColor = vec4(finalGlow, alpha);
  }
  `
);

import { extend } from '@react-three/fiber';
extend({ KreoCoreMaterial });

function KREOCore() {
    const meshRef = useRef();
    const materialRef = useRef();

    useFrame((state, delta) => {
        if (!materialRef.current || !meshRef.current) return;

        const { progress, velocity } = globalScrollState;
        // Map the global AI state into numbers suitable for lerping / shaders
        const targetListening = globalVoiceState.isAwaitingCommand ? 1.0 : 0.0;
        const targetSpeaking = globalVoiceState.isSpeaking ? 1.0 : 0.0;

        const collapseVal = THREE.MathUtils.clamp((progress - 0.22) / 0.11, 0, 1) - THREE.MathUtils.clamp((progress - 0.33) / 0.11, 0, 1);

        materialRef.current.uTime = state.clock.elapsedTime;
        materialRef.current.uProgress = THREE.MathUtils.lerp(materialRef.current.uProgress, progress, 0.1);
        materialRef.current.uVelocity = THREE.MathUtils.lerp(materialRef.current.uVelocity, velocity, 0.1);
        materialRef.current.uCollapse = THREE.MathUtils.lerp(materialRef.current.uCollapse, collapseVal, 0.1);

        // Voice interpolation for smooth transitioning between modes
        materialRef.current.uListening = THREE.MathUtils.lerp(materialRef.current.uListening, targetListening, 0.1);
        materialRef.current.uSpeaking = THREE.MathUtils.lerp(materialRef.current.uSpeaking, targetSpeaking, 0.15); // Snappier audio reactivity

        meshRef.current.rotation.y += delta * 0.2;
        meshRef.current.rotation.x += delta * 0.1;

        const floatAmount = THREE.MathUtils.clamp((progress - 0.33) / 0.11, 0, 1) - THREE.MathUtils.clamp((progress - 0.44) / 0.11, 0, 1);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, Math.sin(state.clock.elapsedTime * 2) * floatAmount * 0.5, 0.05);
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 128, 128]} />
            <kreoCoreMaterial ref={materialRef} transparent={true} />
        </mesh>
    );
}

function PhysicsParticles() {
    const count = 3000;

    const [positions, initialPositions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const initialPos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 10 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
            initialPos[i * 3] = x;
            initialPos[i * 3 + 1] = y;
            initialPos[i * 3 + 2] = z;
        }
        return [pos, initialPos];
    }, []);

    const pointsRef = useRef();

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const { progress, velocity } = globalScrollState;
        const geometry = pointsRef.current.geometry;
        const positionsArray = geometry.attributes.position.array;

        const isCompressing = progress > 0.05 && progress < 0.22;
        const isAntiGravity = progress > 0.33 && progress < 0.55;
        const isDominion = progress >= 0.85;

        // AI Speaking forces particle pulse outward slightly
        const speakingPulseForce = globalVoiceState.isSpeaking ? Math.sin(state.clock.elapsedTime * 15) * 0.05 : 0;

        for (let i = 0; i < count; i++) {
            let x = positionsArray[i * 3];
            let y = positionsArray[i * 3 + 1];
            let z = positionsArray[i * 3 + 2];
            const initialX = initialPositions[i * 3];
            const initialY = initialPositions[i * 3 + 1];
            const initialZ = initialPositions[i * 3 + 2];

            let dx = Math.sin(state.clock.elapsedTime * 0.5 + initialY) * 0.02;
            let dy = Math.cos(state.clock.elapsedTime * 0.4 + initialX) * 0.02;
            let dz = Math.sin(state.clock.elapsedTime * 0.3 + initialZ) * 0.02;

            if (isCompressing) {
                dx -= x * 0.05; dy -= y * 0.05; dz -= z * 0.05;
            } else if (isAntiGravity) {
                dy += 0.1 + (velocity * 0.05);
                if (y > 20) { y = -20; x = initialX; z = initialZ; }
            } else if (isDominion) {
                const r = Math.sqrt(x * x + y * y + z * z);
                const force = 0.5;
                dx -= (x / r) * force; dy -= (y / r) * force; dz -= (z / r) * force;
                const spinForce = 0.2;
                dx += -z * spinForce; dz += x * spinForce;
            } else {
                dx += (initialX - x) * 0.001; dy += (initialY - y) * 0.001; dz += (initialZ - z) * 0.001;
            }

            if (globalVoiceState.isSpeaking) {
                const r = Math.sqrt(x * x + y * y + z * z) || 1;
                dx += (x / r) * speakingPulseForce;
                dy += (y / r) * speakingPulseForce;
                dz += (z / r) * speakingPulseForce;
            }

            const timeDilation = 1.0 + Math.abs(velocity) * 2.0;

            positionsArray[i * 3] += dx * timeDilation;
            positionsArray[i * 3 + 1] += dy * timeDilation;
            positionsArray[i * 3 + 2] += dz * timeDilation;
        }

        geometry.attributes.position.needsUpdate = true;
        pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05 + progress * Math.PI * 2;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
}

function DebugCube() {
    const meshRef = useRef();
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta;
            meshRef.current.rotation.y += delta;

            // Pulse based on voice waiting
            const scale = globalVoiceState.isAwaitingCommand ? 1.5 : 1.0;
            meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
        }
    });
    return (
        <mesh ref={meshRef} position={[0, -3, -5]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ff00ff" wireframe={true} />
        </mesh>
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("[THREEJS] Canvas Crash:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#f00', zIndex: 9999, background: '#000', padding: '20px', border: '1px solid #f00' }}>
                    <h2>THREE.JS RENDER FAILURE</h2>
                    <p>{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function CanvasBackground() {
    useEffect(() => {
        console.log("[SYSTEM] ThreeJS Canvas Mounted.");
        // We can communicate back to App's systemHealth safely via an event or just let it be 'OK'
        setTimeout(() => {
            const event = new CustomEvent('threejs-health', { detail: 'OK' });
            window.dispatchEvent(event);
        }, 100);

        return () => {
            console.warn("[SYSTEM] ThreeJS Canvas UNMOUNTED.");
            window.dispatchEvent(new CustomEvent('threejs-health', { detail: 'FAIL' }));
        }
    }, []);

    return (
        <ErrorBoundary>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: false, antialias: true, clearColor: '#000000' }}>
                <PhysicsParticles />
                <KREOCore />
                {/* Fallback persistent geometry so we always see something even if Core fails visually */}
                <DebugCube />
            </Canvas>
        </ErrorBoundary>
    );
}
