import Link from 'next/link';
import { allElements } from '@/lib/data';
import { PeriodicTable } from '@/components/PeriodicTable';
import Pretext from '@chenglou/pretext';

export default function HomePage() {
  return (
    <>
      <h2>Machine-edited atlas of the periodic table</h2>
      <Pretext width={70}>Atlas composes relationships through ranking plates, set views, and element folios built from Wikidata records and Wikipedia excerpts.</Pretext>
      <div className="thin-rule" />
      <PeriodicTable elements={allElements} />
      <p style={{ marginTop: '1rem' }}><Link href="/atlas/rank/mass">Start with mass ranking</Link></p>
    </>
  );
}
