import { notFound } from 'next/navigation';
import { getElement } from '@/lib/data';
import { CompareView } from '@/components/CompareView';

export default async function ComparePage({ params }: { params: Promise<{ symbolA: string; symbolB: string }> }) {
  const { symbolA, symbolB } = await params;
  const a = getElement(symbolA);
  const b = getElement(symbolB);
  if (!a || !b) return notFound();
  return <CompareView a={a} b={b} />;
}
