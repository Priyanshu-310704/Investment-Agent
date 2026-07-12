import { HistoryEntry } from '@/lib/types';
import FactorBarChart from './report/FactorBarChart';
import FactorGrid from './report/FactorGrid';
import FactorRadar from './report/FactorRadar';
import InsightList from './report/InsightList';
import MetricsTable from './report/MetricsTable';
import ReportHero from './report/ReportHero';
import SourcesList from './report/SourcesList';

interface ReportDisplayProps {
  report: HistoryEntry;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  return (
    <article className="report-shell">
      <ReportHero report={report} />

      <section className="analysis-grid">
        <div className="panel span-two">
          <div className="section-kicker">Executive View</div>
          <h2 className="section-heading">Recommendation Rationale</h2>
          <p className="summary-text">{report.summary}</p>
        </div>

        <InsightList title="Investment Thesis" items={report.investment_thesis} tone="positive" />
        <InsightList title="Watch Items" items={report.watch_items} tone="caution" />
      </section>

      <section className="chart-grid">
        <div className="panel">
          <div className="section-kicker">Factor Map</div>
          <h2 className="section-heading">Research Coverage</h2>
          <FactorRadar factors={report.factors} decision={report.decision} />
        </div>

        <div className="panel">
          <div className="section-kicker">Score Breakdown</div>
          <h2 className="section-heading">Strength by Dimension</h2>
          <FactorBarChart factors={report.factors} />
        </div>
      </section>

      <MetricsTable metrics={report.key_metrics} />
      <FactorGrid factors={report.factors} />
      <SourcesList sources={report.sources} />
    </article>
  );
}
