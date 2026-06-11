'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  value: string; // e.g. "537", "92%", "v0.2.6"
  className?: string;
}

function parseNum(val: string): { prefix: string; num: number | null; suffix: string } {
  const match = val.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: '', num: null, suffix: val };
  return { prefix: match[1], num: parseFloat(match[2]), suffix: match[3] };
}

export default function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  const reduced = useReducedMotion();
  const [displayed, setDisplayed] = useState('0');
  const started = useRef(false);

  const { prefix, num, suffix } = parseNum(value);

  useEffect(() => {
    if (!inView || started.current || num === null || reduced) {
      if (inView) setDisplayed(value);
      return;
    }
    started.current = true;
    const duration = 1200;
    const start = Date.now();
    const from = 0;
    const to = num;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(prefix + current + suffix);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, num, prefix, suffix, value, reduced]);

  return (
    <span ref={ref} className={className}>
      {inView ? displayed : (num !== null ? prefix + '0' + suffix : value)}
    </span>
  );
}
