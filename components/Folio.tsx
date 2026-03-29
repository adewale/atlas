import Link from 'next/link';
import Pretext from '@chenglou/pretext';
import type { ElementRecord } from '@/lib/types';

export function Folio({ element }: { element: ElementRecord }) {
  return (
    <article style={{ display: 'grid', gridTemplateColumns: '1fr minmax(230px, 30ch)', gap: '2rem' }}>
      <section>
        <div className="hero-number">{String(element.atomicNumber).padStart(3, '0')}</div>
        <div className="hero-symbol">{element.symbol}</div>
        <h2 style={{ marginTop: 0 }}>{element.name}</h2>
        <div className="thin-rule" />
        <Pretext width={65}>
          {element.summary ?? `${element.name} is presented as an atlas plate entry. For textual description, use the linked Wikipedia article.`}
        </Pretext>
        <div className="thin-rule" />
        <svg viewBox="0 0 600 180" style={{ width: '100%', border: '1px solid #0f0f0f', background: '#fff' }}>
          <rect x="0" y="0" width="600" height="180" fill="#f7f2e8" />
          <text x="24" y="56" fontSize="42" fill="#133e7c">Group {element.group ?? '—'}</text>
          <text x="24" y="98" fontSize="32" fill="#9e1c2c">Period {element.period}</text>
          <text x="24" y="136" fontSize="26">Block {element.block.toUpperCase()}</text>
          <text x="400" y="92" fontSize="72" fill="#c59b1a" textAnchor="middle">{element.symbol}</text>
        </svg>
      </section>
      <aside className="panel">
        <h3 style={{ marginTop: 0 }}>Marginalia</h3>
        <Pretext as="div" width={28}>Category: <strong>{element.category}</strong></Pretext>
        <Pretext as="div" width={28}>Mass rank context and neighboring entries can be used for quick comparisons.</Pretext>
        <div className="thin-rule" />
        <h4>Source strip</h4>
        <Pretext as="div" width={30}><strong>Data:</strong> Wikidata (CC0)</Pretext>
        <Pretext as="div" width={30}><strong>Text:</strong> <a href={element.wikipediaUrl}>{element.wikipediaTitle}</a> (Wikipedia excerpt)</Pretext>
        <Pretext as="div" width={30}><strong>Media:</strong> Wikimedia Commons file page with visible credit and license metadata.</Pretext>
        <div className="thin-rule" />
        <p><Link href={`/compare/${element.symbol}/O`}>Compare with Oxygen</Link></p>
      </aside>
    </article>
  );
}
