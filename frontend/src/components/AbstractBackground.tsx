'use client';

import { useCallback, useEffect, useRef } from 'react';

// Simple noise function for topographic effect
function createNoise() {
  const permutation = Array.from({ length: 256 }, (_, i) => i);
  for (let i = permutation.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  const p = [...permutation, ...permutation];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(v,
      lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
      lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
    );
  };
}

interface Props {
  className?: string;
}

export function AbstractBackground({ className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef(createNoise());
  const pointerRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const noise = noiseRef.current;
    const pointer = pointerRef.current;
    const time = timeRef.current;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw topographic lines
    const scale = 0.008;
    const levels = 20;
    const lineSpacing = 1 / levels;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;

    for (let level = 0; level < levels; level++) {
      const threshold = level * lineSpacing;
      
      ctx.beginPath();
      let isDrawing = false;

      for (let x = 0; x < width; x += 4) {
        for (let y = 0; y < height; y += 4) {
          // Calculate distance from pointer for interaction
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 200);
          
          // Add time-based animation and pointer distortion
          const noiseVal = noise(
            x * scale + Math.sin(time * 0.5) * 0.3 + influence * dx * 0.002,
            y * scale + Math.cos(time * 0.5) * 0.3 + influence * dy * 0.002
          );
          
          const normalizedNoise = (noiseVal + 1) / 2;
          
          // Draw point if near threshold
          if (Math.abs(normalizedNoise - threshold) < 0.03) {
            if (!isDrawing) {
              ctx.moveTo(x, y);
              isDrawing = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            isDrawing = false;
          }
        }
      }
      ctx.stroke();
    }

    // Increment time for animation
    timeRef.current += 0.008;
    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Track pointer
    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const handlePointerLeave = () => {
      pointerRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    // Start animation
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
