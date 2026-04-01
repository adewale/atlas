import { DEEP_BLUE, GREY_MID, MONO_FONT, INSCRIPTION_STYLE } from '../lib/theme';

interface HeroHeaderProps {
  numeral: string | number;
  numeralColor: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
}

export default function HeroHeader({
  numeral,
  numeralColor,
  title,
  titleColor = DEEP_BLUE,
  subtitle,
}: HeroHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '12px 0' }}>
      <span style={{
        fontSize: '96px',
        fontWeight: 'bold',
        fontFamily: MONO_FONT,
        lineHeight: 0.78,
        color: numeralColor,
        letterSpacing: '-0.02em',
      }}>
        {numeral}
      </span>
      <div style={{ paddingTop: '0.15em' }}>
        <h1 style={{
          ...INSCRIPTION_STYLE,
          margin: 0,
          color: titleColor,
        }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: '13px', color: GREY_MID, marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
