import Link from 'next/link';
import Pretext from '@chenglou/pretext';
import type { ElementRecord } from '@/lib/types';

export function AtlasPlate({ title, caption, elements }: { title: string; caption: string; elements: ElementRecord[] }) {
  return (
    <section>
      <h2>{title}</h2>
      <Pretext width={72}>{caption}</Pretext>
      <svg viewBox="0 0 1200 520" style={{ width: '100%', border: '1px solid #111', background: 'white' }}>
        {elements.map((el, i) => {
          const x = (i % 10) * 118 + 8;
          const y = Math.floor(i / 10) * 95 + 8;
          return (
            <g key={el.symbol}>
              <rect x={x} y={y} width="110" height="86" fill="#f7f2e8" stroke="#111" />
              <text x={x + 8} y={y + 16} fontSize="11">{el.atomicNumber}</text>
              <text x={x + 55} y={y + 54} textAnchor="middle" fontSize="36" fontWeight="700">{el.symbol}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.6rem' }}>
        {elements.map((el) => <Link key={el.symbol} href={`/element/${el.symbol}`}>{el.symbol}</Link>)}
      </div>
    </section>
  );
}
