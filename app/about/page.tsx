import Pretext from '@chenglou/pretext';

export default function AboutPage() {
  return (
    <section>
      <h2>About Atlas</h2>
      <Pretext width={64}>Atlas is a machine-edited periodic atlas. It privileges composition, comparison, and ranking over long-form narrative. Facts are normalized from Wikidata, summaries are attributed to Wikipedia, and media credits map to Wikimedia Commons records.</Pretext>
      <div className="thin-rule" />
      <ul>
        <li>No original chemistry prose in folios.</li>
        <li>SVG-first rendering for plates and compare bands.</li>
        <li>Build-time JSON generation for deterministic deploys.</li>
      </ul>
    </section>
  );
}
