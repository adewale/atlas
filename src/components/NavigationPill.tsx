import { Link } from 'react-router';
import { NAV_PILL_STYLE } from '../lib/theme';

interface NavigationPillProps {
  to: string;
  label: string;
  color: string;
  dot?: boolean;
  title?: string;
}

export default function NavigationPill({
  to,
  label,
  color,
  dot = true,
  title,
}: NavigationPillProps) {
  return (
    <Link
      to={to}
      title={title}
      style={{
        ...NAV_PILL_STYLE,
        padding: '10px 12px',
        border: `1.5px solid ${color}`,
        color,
      }}
    >
      {dot && (
        <span
          style={{
            width: '8px',
            height: '8px',
            background: color,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </Link>
  );
}
