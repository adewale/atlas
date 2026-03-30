import { useParams } from 'react-router';

export default function AtlasBlock() {
  const { block } = useParams();
  return (
    <main>
      <h1>Atlas — Block {block}</h1>
      <p>Atlas plate — to be implemented.</p>
    </main>
  );
}
