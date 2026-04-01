import { useCallback } from 'react';
import Particles from '@tsparticles/react';

export default function ParticleBackground({ variant = 'network' }) {
  const configs = {
    network: {
      particles: {
        number: { value: 60, density: { enable: true, width: 1920, height: 1080 } },
        color: { value: '#6366f1' },
        opacity: { value: 0.3 },
        size: { value: { min: 1, max: 3 } },
        links: { enable: true, distance: 150, color: '#6366f1', opacity: 0.15, width: 1 },
        move: { enable: true, speed: 1, direction: 'none', outModes: 'bounce' },
      },
    },
    stars: {
      particles: {
        number: { value: 100 },
        color: { value: ['#6366f1', '#8b5cf6', '#06b6d4'] },
        opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: 1 } },
        size: { value: { min: 0.5, max: 2 } },
        move: { enable: true, speed: 0.3, direction: 'none' },
      },
    },
    bubbles: {
      particles: {
        number: { value: 30 },
        color: { value: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'] },
        opacity: { value: 0.15 },
        size: { value: { min: 5, max: 25 } },
        move: { enable: true, speed: 0.5, direction: 'top', outModes: 'out' },
      },
    },
  };

  return (
    <Particles
      className="absolute inset-0 -z-10"
      options={{
        fullScreen: false,
        background: { color: 'transparent' },
        fpsLimit: 60,
        ...configs[variant],
        detectRetina: true,
      }}
    />
  );
}
