import { useCallback } from 'react';
import { useNavigate } from 'react-router';

/**
 * SVG-compatible link that uses React Router for client-side navigation.
 *
 * Inside `<svg>`, React Router's `<Link>` cannot be used because SVG uses
 * `SVGAElement` (which triggers full page reloads). This component renders
 * an SVG `<a>` for accessibility (keyboard nav, right-click, screen readers)
 * but intercepts clicks to use `navigate()` for SPA routing.
 *
 * Lesson #7: Plain `<a>` tags for internal navigation cause full page reloads.
 */
export default function SvgLink({
  to,
  children,
  style,
  'aria-label': ariaLabel,
}: {
  to: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  'aria-label'?: string;
}) {
  const navigate = useNavigate();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Allow ctrl/cmd-click to open in new tab
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      navigate(to);
    },
    [navigate, to],
  );

  return (
    <a href={to} onClick={handleClick} style={style} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
