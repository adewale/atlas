import { useParams, useLoaderData } from 'react-router';
import { WARM_RED, DEEP_BLUE } from '../lib/theme';
import { VT } from '../lib/transitions';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import MarginNote from '../components/MarginNote';
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
      viewTransitionName={VT.DATA_PLATE_PERIOD}
      description={period?.description}
      elements={period ? period.elements : []}
      caption={`Period ${n}`}
      captionColor={color}
      marginNote={
        <MarginNote label="Periods" color={color} top={60}>
          <p style={{ margin: 0 }}>
            A <strong>period</strong> is a horizontal row. Each new period adds an electron shell, so elements grow larger and their chemistry shifts as you move down the table.
          </p>
        </MarginNote>
      }
    />
  );
}
