'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const CHECKS = [
  { id: 1, label: 'NFT ownership',       short: 'NFT' },
  { id: 2, label: 'Policy certificate',  short: 'CERT' },
  { id: 3, label: 'Borrower balance',    short: 'BAL' },
  { id: 4, label: 'Loan default flag',   short: 'FLAG' },
  { id: 5, label: 'Grace period',        short: 'GRACE' },
  { id: 6, label: 'Vault collateral',    short: 'COL' },
  { id: 7, label: 'NFT burn auth',       short: 'BURN' },
  { id: 8, label: 'Escrow condition',    short: 'ESC' },
  { id: 9, label: 'Resolution path',     short: 'RES' },
];

// Circle layout: 8 nodes around perimeter + 1 center hub
const CX = 180, CY = 160, R = 110;
const positions = CHECKS.map((_, i) => {
  if (i === 8) return { x: CX, y: CY }; // center node
  const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
  return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
});

// Edges: all outer nodes connect to center (index 8)
const edges = [0,1,2,3,4,5,6,7].map(i => ({ from: i, to: 8 }));
// Plus a ring: each outer node connects to next
const ring = [0,1,2,3,4,5,6,7].map(i => ({ from: i, to: (i+1) % 8 }));

export default function ValidationViz() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-80px 0px' });
  const reduced = useReducedMotion();
  const [lit, setLit] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<number>(-1);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setLit(new Set([0,1,2,3,4,5,6,7,8]));
      return;
    }

    let step = 0;
    const next = () => {
      if (step <= 8) {
        setActive(step);
        setLit(prev => new Set([...prev, step]));
        step++;
        animRef.current = setTimeout(next, 320);
      } else {
        setActive(-1);
        // Loop after pause
        animRef.current = setTimeout(() => {
          step = 0;
          setLit(new Set());
          animRef.current = setTimeout(next, 400);
        }, 2800);
      }
    };
    animRef.current = setTimeout(next, 600);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [inView, reduced]);

  return (
    <div ref={ref} className="relative w-full" style={{ maxWidth: 360 }}>
      <svg
        viewBox="0 0 360 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-label="9 on-ledger validation checks visualized as connected nodes"
        role="img"
      >
        {/* Ring edges */}
        {ring.map(({ from, to }, i) => {
          const bothLit = lit.has(from) && lit.has(to);
          return (
            <line
              key={`ring-${i}`}
              x1={positions[from].x} y1={positions[from].y}
              x2={positions[to].x}   y2={positions[to].y}
              stroke={bothLit ? 'rgba(167,197,229,0.5)' : 'rgba(228,233,242,0.6)'}
              strokeWidth={bothLit ? 1.5 : 1}
              style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
            />
          );
        })}
        {/* Hub edges */}
        {edges.map(({ from, to }, i) => {
          const fromLit = lit.has(from);
          const toLit = lit.has(to);
          const bothLit = fromLit && toLit;
          return (
            <line
              key={`edge-${i}`}
              x1={positions[from].x} y1={positions[from].y}
              x2={positions[to].x}   y2={positions[to].y}
              stroke={bothLit ? 'rgba(184,151,58,0.4)' : 'rgba(228,233,242,0.4)'}
              strokeWidth={bothLit ? 1.5 : 1}
              strokeDasharray={bothLit ? 'none' : '4 4'}
              style={{ transition: 'stroke 0.4s ease, stroke-width 0.3s ease' }}
            />
          );
        })}

        {/* Outer check nodes */}
        {CHECKS.slice(0, 8).map((check, i) => {
          const { x, y } = positions[i];
          const isLit = lit.has(i);
          const isActive = active === i;
          return (
            <g key={check.id}>
              {/* Glow ring when active */}
              {isActive && (
                <circle cx={x} cy={y} r={20} fill="rgba(167,197,229,0.15)" />
              )}
              <circle
                cx={x} cy={y} r={14}
                fill={isLit ? '#0f2439' : '#ffffff'}
                stroke={isLit ? 'rgba(167,197,229,0.6)' : '#E4E9F2'}
                strokeWidth={isLit ? 1.5 : 1}
                style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
              />
              <text
                x={x} y={y + 4}
                textAnchor="middle"
                fontSize={8}
                fontFamily="DM Mono, monospace"
                fontWeight={600}
                fill={isLit ? '#a7c5e5' : '#8a9bb0'}
                style={{ transition: 'fill 0.3s ease' }}
              >
                {i + 1}
              </text>
              {/* Label outside */}
              <text
                x={x + (x < CX ? -20 : x > CX ? 20 : 0)}
                y={y + (y < CY ? -20 : y > CY ? 20 : 0)}
                textAnchor={x < CX - 20 ? 'end' : x > CX + 20 ? 'start' : 'middle'}
                fontSize={7}
                fontFamily="DM Mono, monospace"
                fill={isLit ? '#5a7a99' : '#c8d9eb'}
                style={{ transition: 'fill 0.3s ease' }}
              >
                {check.short}
              </text>
            </g>
          );
        })}

        {/* Center hub — resolution node */}
        {(() => {
          const { x, y } = positions[8];
          const isLit = lit.has(8);
          const isActive = active === 8;
          return (
            <g key="hub">
              {isLit && (
                <circle cx={x} cy={y} r={30} fill="rgba(184,151,58,0.08)" />
              )}
              {isActive && (
                <circle cx={x} cy={y} r={36} fill="rgba(184,151,58,0.05)" />
              )}
              <circle
                cx={x} cy={y} r={22}
                fill={isLit ? '#0f2439' : '#F9FAFC'}
                stroke={isLit ? '#b8973a' : '#E4E9F2'}
                strokeWidth={isLit ? 2 : 1.5}
                style={{ transition: 'all 0.4s ease' }}
              />
              <text
                x={x} y={y - 3}
                textAnchor="middle"
                fontSize={7}
                fontFamily="DM Mono, monospace"
                fontWeight={700}
                fill={isLit ? '#b8973a' : '#8a9bb0'}
                style={{ transition: 'fill 0.3s ease' }}
              >
                WARD
              </text>
              <text
                x={x} y={y + 7}
                textAnchor="middle"
                fontSize={6}
                fontFamily="DM Mono, monospace"
                fill={isLit ? '#a7c5e5' : '#c8d9eb'}
                style={{ transition: 'fill 0.3s ease' }}
              >
                9/9
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Check list below */}
      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1">
        {CHECKS.map((check, i) => (
          <div
            key={check.id}
            className="flex items-center gap-1.5"
            style={{ opacity: lit.has(i) ? 1 : 0.4, transition: 'opacity 0.3s ease' }}
          >
            <span
              style={{
                width: 14, height: 14,
                borderRadius: '50%',
                background: lit.has(i) ? (i === 8 ? '#b8973a' : '#0f2439') : '#E4E9F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, color: lit.has(i) ? (i === 8 ? '#fff' : '#a7c5e5') : '#8a9bb0',
                fontFamily: 'DM Mono, monospace',
                fontWeight: 700,
                flexShrink: 0,
                transition: 'background 0.3s ease',
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 9, color: '#5a7a99', fontFamily: 'DM Mono, monospace', lineHeight: 1.2 }}>
              {check.short}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
