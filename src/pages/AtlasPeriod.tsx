import { useParams, useLoaderData } from 'react-router';
import { WARM_RED, DEEP_BLUE } from '../lib/theme';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import type { PeriodData } from '../lib/types';

export default function AtlasPeriod() {
  const { n } = useParams();
  const { periods } = useLoaderData() as { periods: PeriodData[] };

  const period = periods.find((p) => p.n === Number(n));
  const color = (Number(n) - 1) % 2 === 0 ? WARM_RED : DEEP_BLUE;

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Table', to: '/' }}
      heading={`Period ${n}`}
      color={color}
      viewTransitionName="data-plate-period"
      description={period?.description}
      elements={period ? period.elements : []}
      caption={`Period ${n}`}
      captionColor={color}
    />
  );
}
