import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import { BLACK } from '../lib/theme';
import { useIsMobile } from '../hooks/useIsMobile';
import PretextSvg from './PretextSvg';

type IntroBlockProps = {
  text: string;
  color: string;
  desktopWidth?: number;
  mobileWidth?: number;
  dropCapSize?: number;
  minHeight?: number;
  marginBottom?: string;
};

export default function IntroBlock({
  text,
  color,
  desktopWidth = 760,
  mobileWidth = 360,
  dropCapSize = 48,
  minHeight = 80,
  marginBottom = '12px',
}: IntroBlockProps) {
  const isMobile = useIsMobile();
  const introWidth = isMobile ? mobileWidth : desktopWidth;
  const { dropCap, lines, lineHeight } = useDropCapText({
    text,
    maxWidth: introWidth,
    dropCapFont: `${dropCapSize}px ${DROP_CAP_FONT}`,
  });
  const height = Math.max(lines.length * lineHeight + lineHeight, minHeight);

  return (
    <svg
      viewBox={`0 0 ${introWidth} ${height}`}
      style={{ width: '100%', maxWidth: introWidth, display: 'block', marginBottom }}
    >
      <PretextSvg
        lines={lines}
        lineHeight={lineHeight}
        y={0}
        maxWidth={introWidth}
        animationStagger={40}
        dropCap={{ fontSize: dropCapSize, fill: color, char: dropCap.char }}
      />
    </svg>
  );
}
