import { ResearchFactor } from '@/lib/types';
import FactorCard from './FactorCard';

interface FactorGridProps {
  factors: ResearchFactor[];
}

export default function FactorGrid({ factors }: FactorGridProps) {
  return (
    <section className="factor-section">
      <div className="section-kicker">Deep Analysis</div>
      <h2 className="section-heading">Research Factors</h2>
      <div className="factor-grid">
        {factors.map((factor) => (
          <FactorCard key={factor.key} factor={factor} />
        ))}
      </div>
    </section>
  );
}
