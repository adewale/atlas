import Pretext from '@chenglou/pretext';
import type { ElementRecord } from '@/lib/types';

export function CompareView({ a, b }: { a: ElementRecord; b: ElementRecord }) {
  return (
    <section>
      <h2>Compare {a.symbol} ⇄ {b.symbol}</h2>
      <svg viewBox="0 0 1000 300" style={{ width: '100%', border: '1px solid #111', background: '#fff' }}>
        <rect x="0" y="0" width="500" height="300" fill="#133e7c" />
        <rect x="500" y="0" width="500" height="300" fill="#9e1c2c" />
        <text x="250" y="160" textAnchor="middle" fontSize="120" fill="#f7f2e8" fontWeight="700">{a.symbol}</text>
        <text x="750" y="160" textAnchor="middle" fontSize="120" fill="#f7f2e8" fontWeight="700">{b.symbol}</text>
      </svg>
      <Pretext width={62}>Compare-band note: period {a.period} to {b.period}, block {a.block} to {b.block}, and category transitions reveal editorial contrast rather than textbook narration.</Pretext>
    </section>
  );
}
