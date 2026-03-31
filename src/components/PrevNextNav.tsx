import { Link } from 'react-router';
import { GREY_MID } from '../lib/theme';

interface PrevNextNavProps {
  prev?: { label: string; to: string };
  next?: { label: string; to: string };
  style?: React.CSSProperties;
}

export default function PrevNextNav({ prev, next, style }: PrevNextNavProps) {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        ...style,
      }}
    >
      {prev ? (
        <Link to={prev.to} style={{ color: GREY_MID, textDecoration: 'none' }}>
          ← {prev.label}
        </Link>
      ) : <span />}
      {next ? (
        <Link to={next.to} style={{ color: GREY_MID, textDecoration: 'none' }}>
          {next.label} →
        </Link>
      ) : <span />}
    </nav>
  );
}
