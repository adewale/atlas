import { notFound } from 'next/navigation';
import { AtlasPlate } from '@/components/AtlasPlate';
import { allElements } from '@/lib/data';

const anomalies: Record<string, (n: number) => boolean> = {
  'synthetic-heavy': (n) => n > 103,
  'f-block-gap': (n) => (n >= 57 && n <= 71) || (n >= 89 && n <= 103)
};

export default async function AnomalyPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const filter = anomalies[slug];
  if (!filter) return notFound();
  const elements = allElements.filter((e) => filter(e.atomicNumber));
  return <AtlasPlate title={`Anomaly: ${slug}`} caption="Editorial anomaly set used to highlight structural oddities." elements={elements} />;
}
