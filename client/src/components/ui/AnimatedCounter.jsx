import { useEffect, useRef, useState } from 'react';

export default function AnimatedCounter({ end, value, prefix = '', suffix = '', duration = 1.5, className = '' }) {
  const target = end ?? value ?? 0;
  const [count, setCount] = useState(0);
  const animRef = useRef(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const from = prevTarget.current;
    const to = target;
    prevTarget.current = to;
    if (from === to) { setCount(to); return; }

    const startTime = performance.now();
    const durationMs = duration * 1000;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (to - from) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, duration]);

  return <span className={className}>{prefix}{count.toLocaleString()}{suffix}</span>;
}
