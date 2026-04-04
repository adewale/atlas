import SvgLink from './SvgLink';
import { GREY_MID } from '../lib/theme';
import { PRETEXT_SANS } from '../lib/pretext';

type SvgPrevNextProps = {
  prev?: { label: string; to: string };
  next?: { label: string; to: string };
  ariaLabel?: string;
};

export default function SvgPrevNext({ prev, next, ariaLabel = 'Previous and next navigation' }: SvgPrevNextProps) {
  if (!prev && !next) return null;
  return (
    <svg width="100%" height={24} viewBox="0 0 400 24" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: 560 }} aria-label={ariaLabel}>
      {prev && (
        <SvgLink to={prev.to}>
          <text x={4} y={16} fontSize={11} fill={GREY_MID} fontFamily={PRETEXT_SANS}>← {prev.label}</text>
        </SvgLink>
      )}
      {next && (
        <SvgLink to={next.to}>
          <text x={396} y={16} fontSize={11} fill={GREY_MID} fontFamily={PRETEXT_SANS} textAnchor="end">{next.label} →</text>
        </SvgLink>
      )}
    </svg>
  );
}
