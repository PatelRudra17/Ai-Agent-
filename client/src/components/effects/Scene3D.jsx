import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sphere, Torus, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

function FloatingOrb({ position, color, size = 1, speed = 1, distort = 0.4 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.3;
    ref.current.rotation.y += 0.003 * speed;
  });
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <Sphere ref={ref} args={[size, 64, 64]} position={position}>
        <MeshDistortMaterial color={color} roughness={0.1} metalness={0.8} distort={distort} speed={2} transparent opacity={0.6} />
      </Sphere>
    </Float>
  );
}

function FloatingRing({ position, color, size = 1.5 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    ref.current.rotation.y += 0.005;
    ref.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <Torus ref={ref} args={[size, 0.05, 16, 100]} position={position}>
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.9} transparent opacity={0.5} />
    </Torus>
  );
}

function Particles({ count = 200 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    ref.current.rotation.y += 0.0005;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#8b5cf6" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function FloatingGeo({ position, color }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x += 0.005;
    ref.current.rotation.y += 0.008;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
  });
  return (
    <Icosahedron ref={ref} args={[0.5, 1]} position={position}>
      <MeshWobbleMaterial color={color} factor={0.3} speed={1.5} roughness={0.2} metalness={0.7} transparent opacity={0.4} wireframe />
    </Icosahedron>
  );
}

export default function Scene3D({ variant = 'login' }) {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#06b6d4" />
        <pointLight position={[3, 3, -3]} intensity={0.2} color="#ec4899" />

        {variant === 'login' && (
          <>
            <FloatingOrb position={[-3, 1.5, -2]} color="#8b5cf6" size={0.8} speed={1.2} distort={0.5} />
            <FloatingOrb position={[3, -1, -3]} color="#06b6d4" size={0.6} speed={0.8} distort={0.3} />
            <FloatingOrb position={[0, 2.5, -4]} color="#ec4899" size={0.4} speed={1.5} distort={0.6} />
            <FloatingRing position={[2, 1, -2]} color="#8b5cf6" size={1.2} />
            <FloatingRing position={[-2, -1, -3]} color="#06b6d4" size={0.8} />
            <FloatingGeo position={[-1.5, -2, -1]} color="#a855f7" />
            <FloatingGeo position={[2.5, 2, -2]} color="#06b6d4" />
          </>
        )}

        {variant === 'dashboard' && (
          <>
            <FloatingOrb position={[4, 2, -5]} color="#6366f1" size={1} speed={0.5} distort={0.3} />
            <FloatingOrb position={[-4, -2, -6]} color="#06b6d4" size={0.7} speed={0.7} distort={0.2} />
            <FloatingRing position={[0, 0, -4]} color="#8b5cf6" size={2} />
          </>
        )}

        <Particles count={300} />
      </Canvas>
    </div>
  );
}
