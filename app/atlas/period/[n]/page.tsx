import { notFound } from 'next/navigation';
import { AtlasPlate } from '@/components/AtlasPlate';
import { allElements } from '@/lib/data';

export default async function PeriodPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isFinite(n)) return notFound();
  const elements = allElements.filter((e) => e.period === n);
  if (!elements.length) return notFound();
  return <AtlasPlate title={`Period ${n}`} caption="Horizontal sequence rendered as a compact plate." elements={elements} />;
}
