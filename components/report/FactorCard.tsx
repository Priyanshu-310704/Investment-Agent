import { ResearchFactor } from '@/lib/types';

interface FactorCardProps {
  factor: ResearchFactor;
}

export default function FactorCard({ factor }: FactorCardProps) {
  return (
    <section className={`factor-card ${factor.status}`}>
      <div className="factor-card-top">
        <div>
          <span className="factor-status">{factor.status}</span>
          <h3>{factor.label}</h3>
        </div>
        <strong>{factor.score}</strong>
      </div>

      <div className="score-track">
        <div className={`score-fill ${factor.status}`} style={{ width: `${factor.score}%` }} />
      </div>

      <p>{factor.analysis}</p>

      <div className="factor-detail-block">
        <span>Evidence</span>
        <ul>
          {(factor.evidence.length ? factor.evidence : ['No separate evidence points were returned for this factor.']).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="factor-implication">
        <span>Decision impact</span>
        <p>{factor.implication}</p>
      </div>
    </section>
  );
}
