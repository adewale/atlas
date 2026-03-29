import * as React from 'react';

type PretextProps<T extends keyof JSX.IntrinsicElements = 'p'> = {
  as?: T;
  width?: number;
  align?: 'left' | 'right' | 'center' | 'justify';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

declare function Pretext<T extends keyof JSX.IntrinsicElements = 'p'>(props: PretextProps<T>): React.ReactElement;

export { Pretext };
export default Pretext;
