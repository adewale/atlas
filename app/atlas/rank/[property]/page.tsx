import { notFound } from 'next/navigation';
import { AtlasPlate } from '@/components/AtlasPlate';
import { allElements } from '@/lib/data';

const props = ['mass', 'electronegativity', 'ionizationEnergy'] as const;

export default async function RankPage({ params }: { params: Promise<{ property: string }> }) {
  const property = (await params).property;
  if (!props.includes(property as never)) return notFound();
  const elements = [...allElements].sort((a, b) => (Number(b[property as keyof typeof b] ?? 0) - Number(a[property as keyof typeof a] ?? 0))).slice(0, 50);
  return <AtlasPlate title={`Ranked by ${property}`} caption="Ranking plate with large symbols and compressed labels." elements={elements} />;
}
