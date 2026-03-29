import { notFound } from 'next/navigation';
import { getElement } from '@/lib/data';
import { Folio } from '@/components/Folio';

export default async function ElementPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const element = getElement(symbol);
  if (!element) return notFound();
  return <Folio element={element} />;
}
