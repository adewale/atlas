import { notFound } from 'next/navigation';
import { AtlasPlate } from '@/components/AtlasPlate';
import { allElements } from '@/lib/data';

export default async function GroupPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isFinite(n)) return notFound();
  const elements = allElements.filter((e) => e.group === n);
  if (!elements.length) return notFound();
  return <AtlasPlate title={`Group ${n}`} caption="Atlas plate for one vertical family." elements={elements} />;
}
