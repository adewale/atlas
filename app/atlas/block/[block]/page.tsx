import { notFound } from 'next/navigation';
import { AtlasPlate } from '@/components/AtlasPlate';
import { allElements } from '@/lib/data';

export default async function BlockPage({ params }: { params: Promise<{ block: string }> }) {
  const block = (await params).block as 's' | 'p' | 'd' | 'f';
  if (!['s', 'p', 'd', 'f'].includes(block)) return notFound();
  const elements = allElements.filter((e) => e.block === block);
  return <AtlasPlate title={`${block.toUpperCase()} block`} caption="Electronic block partition." elements={elements} />;
}
