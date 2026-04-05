import type React from 'react';
import { Link } from 'react-router';
import { BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';

type PageHeaderProps = {
  title: string;
  color: string;
  backTo?: string;
  backLabel?: string;
};

export default function PageHeader({
  title,
  color,
  backTo = '/',
  backLabel = '← Table',
}: PageHeaderProps) {
  return (
    <>
      <Link to={backTo} style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>{backLabel}</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color }}>{title}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
    </>
  );
}
