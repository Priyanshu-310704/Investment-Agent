import { ResearchFactor } from '@/lib/types';

interface FactorBarChartProps {
  factors: ResearchFactor[];
}

export default function FactorBarChart({ factors }: FactorBarChartProps) {
  return (
    <div className="score-chart">
      {factors.map((factor) => (
        <div className="score-row" key={factor.key}>
          <div className="score-row-label">
            <span>{factor.label}</span>
            <strong>{factor.score}</strong>
          </div>
          <div className="score-track">
            <div className={`score-fill ${factor.status}`} style={{ width: `${factor.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
