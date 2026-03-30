import { useParams } from 'react-router';

export default function AtlasCategory() {
  const { slug } = useParams();
  return (
    <main>
      <h1>Atlas — Category {slug}</h1>
      <p>Atlas plate — to be implemented.</p>
    </main>
  );
}
