interface MetricsTableProps {
  metrics: Record<string, string>;
}

export default function MetricsTable({ metrics }: MetricsTableProps) {
  const entries = Object.entries(metrics);
  if (!entries.length) return null;

  return (
    <section className="metrics-section panel">
      <div className="section-kicker">Financial Snapshot</div>
      <h2 className="section-heading">Key Metrics</h2>
      <div className="metrics-grid">
        {entries.map(([key, value]) => (
          <div key={key} className="metric-tile">
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
