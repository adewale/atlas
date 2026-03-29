import { allElements } from '@/lib/data';

export default function CreditsPage() {
  return (
    <section>
      <h2>Credits</h2>
      <p>Data: Wikidata (CC0). Text: Wikipedia excerpts with article attribution. Media: Wikimedia Commons with file-level license and author metadata.</p>
      <table>
        <thead><tr><th>Element</th><th>Wikipedia</th><th>Commons</th></tr></thead>
        <tbody>
          {allElements.slice(0, 40).map((el) => (
            <tr key={el.symbol}>
              <td>{el.symbol}</td>
              <td><a href={el.wikipediaUrl}>{el.wikipediaTitle}</a></td>
              <td><a href="https://commons.wikimedia.org">Commons source</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
