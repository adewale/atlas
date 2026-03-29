import { notFound } from 'next/navigation';
import { AtlasPlate } from '@/components/AtlasPlate';
import { allElements } from '@/lib/data';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  const elements = allElements.filter((e) => e.category === slug);
  if (!elements.length) return notFound();
  return <AtlasPlate title={slug} caption="Category-based atlas set." elements={elements} />;
}
