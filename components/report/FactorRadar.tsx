import { Decision, ResearchFactor } from '@/lib/types';

interface FactorRadarProps {
  factors: ResearchFactor[];
  decision: Decision;
}

export default function FactorRadar({ factors, decision }: FactorRadarProps) {
  const cx = 170;
  const cy = 160;
  const maxRadius = 108;
  const chartFactors = factors.slice(0, 8);
  const accent = decision === 'INVEST' ? '#00c781' : '#ff3b5c';

  const pointFor = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / chartFactors.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      labelX: cx + Math.cos(angle) * (maxRadius + 28),
      labelY: cy + Math.sin(angle) * (maxRadius + 28),
    };
  };

  const polygon = chartFactors
    .map((factor, index) => {
      const point = pointFor(index, factor.score);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const levels = [25, 50, 75, 100];

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 340 330" role="img" aria-label="Radar chart of research factor scores">
        {levels.map((level) => {
          const points = chartFactors
            .map((_, index) => {
              const point = pointFor(index, level);
              return `${point.x},${point.y}`;
            })
            .join(' ');

          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke={level === 100 ? '#cbd5e1' : '#e2e8f0'}
              strokeDasharray={level === 100 ? '0' : '4 5'}
            />
          );
        })}

        {chartFactors.map((factor, index) => {
          const outer = pointFor(index, 100);
          const label = pointFor(index, 100);

          return (
            <g key={factor.key}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e2e8f0" />
              <text
                x={label.labelX}
                y={label.labelY}
                textAnchor={label.labelX < cx - 8 ? 'end' : label.labelX > cx + 8 ? 'start' : 'middle'}
                dominantBaseline="middle"
                className="radar-label"
              >
                {factor.label.replace(' & ', ' / ')}
              </text>
            </g>
          );
        })}

        <polygon points={polygon} fill={`${accent}22`} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
        {chartFactors.map((factor, index) => {
          const point = pointFor(index, factor.score);
          return <circle key={factor.key} cx={point.x} cy={point.y} r="4.5" fill={accent} />;
        })}
      </svg>
    </div>
  );
}
