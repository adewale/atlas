'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ElementRecord } from '@/lib/types';

type Mode = 'none' | 'group' | 'period' | 'block' | 'category' | 'property';

export function PeriodicTable({ elements }: { elements: ElementRecord[] }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('none');
  const [property, setProperty] = useState<'mass' | 'electronegativity' | 'ionizationEnergy'>('mass');
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return elements;
    return elements.filter((el) => el.name.toLowerCase().includes(q) || el.symbol.toLowerCase().includes(q));
  }, [elements, query]);

  const filteredSymbols = new Set(filtered.map((e) => e.symbol));

  const fillFor = (el: ElementRecord) => {
    if (!filteredSymbols.has(el.symbol)) return '#ece7db';
    if (mode === 'group') return el.group && el.group % 2 === 0 ? '#133e7c' : '#c59b1a';
    if (mode === 'period') return el.period % 2 === 0 ? '#9e1c2c' : '#133e7c';
    if (mode === 'block') return { s: '#133e7c', p: '#c59b1a', d: '#9e1c2c', f: '#2e2e2e' }[el.block];
    if (mode === 'category') return el.category.includes('metal') ? '#133e7c' : '#9e1c2c';
    if (mode === 'property') {
      const v = Number(el[property] ?? 0);
      const pct = Math.min(1, v / 20);
      return `color-mix(in srgb, #133e7c ${Math.round(pct * 100)}%, #f7f2e8)`;
    }
    return '#f7f2e8';
  };

  return (
    <section>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '.8rem' }}>
        <label htmlFor="search" className="sr-only">Search</label>
        <input id="search" className="search" placeholder="Search name or symbol" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Highlight mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="none">No highlight</option>
          <option value="group">Group</option>
          <option value="period">Period</option>
          <option value="block">Block</option>
          <option value="category">Category</option>
          <option value="property">Numeric property</option>
        </select>
        {mode === 'property' && <select value={property} onChange={(e) => setProperty(e.target.value as typeof property)}><option value="mass">Mass</option><option value="electronegativity">Electronegativity</option><option value="ionizationEnergy">Ionization</option></select>}
      </div>
      <svg viewBox="0 0 1800 740" className="grid-table" role="img" aria-label="Periodic table with 118 elements">
        {elements.map((el, idx) => {
          const col = el.group ?? (el.block === 'f' ? (el.atomicNumber < 89 ? (el.atomicNumber - 54) : (el.atomicNumber - 86)) : 3);
          const row = el.block === 'f' ? (el.atomicNumber < 89 ? 8 : 9) : el.period;
          const x = (col - 1) * 98 + 10;
          const y = (row - 1) * 70 + 10;
          return (
            <Link key={el.symbol} href={`/element/${el.symbol}`}>
              <g
                tabIndex={0}
                onFocus={() => setActive(idx)}
                onKeyDown={(ev) => {
                  if (ev.key === 'ArrowRight') setActive((v) => Math.min(elements.length - 1, v + 1));
                  if (ev.key === 'ArrowLeft') setActive((v) => Math.max(0, v - 1));
                }}
              >
                <rect x={x} y={y} width="92" height="64" fill={fillFor(el)} stroke={idx === active ? '#9e1c2c' : '#0f0f0f'} strokeWidth={idx === active ? '2' : '1'} />
                <text x={x + 6} y={y + 14} fontSize="10">{el.atomicNumber}</text>
                <text x={x + 46} y={y + 40} textAnchor="middle" fontSize="27" fontWeight="700">{el.symbol}</text>
              </g>
            </Link>
          );
        })}
      </svg>
    </section>
  );
}
