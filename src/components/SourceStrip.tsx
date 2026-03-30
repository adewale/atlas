import type { ElementSources } from '../lib/types';
import { BLACK } from '../lib/theme';

type SourceStripProps = {
  sources: ElementSources;
  ruleColor?: string;
};

/**
 * MANDATORY on every folio — CC BY-SA 4.0 attribution requirement.
 * Shows per-element data provenance with licensing.
 */
export default function SourceStrip({ sources, ruleColor = BLACK }: SourceStripProps) {
  return (
    <div style={{ fontSize: '11px', lineHeight: 1.6, color: BLACK }}>
      <div
        style={{
          borderTop: `1px solid ${ruleColor}`,
          paddingTop: '8px',
          marginTop: '32px',
        }}
      />
      <div>
        <strong>Data:</strong>{' '}
        {sources.structured.url ? (
          <a href={sources.structured.url} target="_blank" rel="noopener noreferrer">
            {sources.structured.provider}
          </a>
        ) : (
          sources.structured.provider
        )}{' '}
        ({sources.structured.license})
      </div>
      <div>
        <strong>Identifiers:</strong>{' '}
        {sources.identifiers.url ? (
          <a href={sources.identifiers.url} target="_blank" rel="noopener noreferrer">
            {sources.identifiers.provider}
          </a>
        ) : (
          sources.identifiers.provider
        )}{' '}
        ({sources.identifiers.license})
      </div>
      <div>
        <strong>Text:</strong>{' '}
        {sources.summary.url ? (
          <a href={sources.summary.url} target="_blank" rel="noopener noreferrer">
            {sources.summary.title}
          </a>
        ) : (
          sources.summary.title
        )}{' '}
        (Wikipedia). Excerpt used under{' '}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY-SA 4.0
        </a>
        . Original article may contain additional content.
        {sources.summary.accessDate && ` Fetched ${sources.summary.accessDate}.`}
      </div>
      <div>
        <strong>Media:</strong> No media in v1
      </div>
    </div>
  );
}
