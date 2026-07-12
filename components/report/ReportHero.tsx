import { HistoryEntry } from '@/lib/types';

interface ReportHeroProps {
  report: HistoryEntry;
}

export default function ReportHero({ report }: ReportHeroProps) {
  const isInvest = report.decision === 'INVEST';
  const averageScore = report.factors.length
    ? Math.round(report.factors.reduce((total, factor) => total + factor.score, 0) / report.factors.length)
    : 0;

  return (
    <header className="report-hero">
      <div>
        <div className="section-kicker">Company Research</div>
        <h1 className="company-name">{report.company_name}</h1>
        <p className="report-timestamp">Analyzed on {new Date(report.created_at).toLocaleString()}</p>
      </div>

      <div className="decision-panel">
        <div className={`decision-badge ${isInvest ? 'invest' : 'pass'}`}>{report.decision}</div>
        <div className="hero-stat">
          <span className="hero-stat-value">{report.confidence}%</span>
          <span className="hero-stat-label">Confidence</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{averageScore}</span>
          <span className="hero-stat-label">Avg. Factor</span>
        </div>
      </div>
    </header>
  );
}
