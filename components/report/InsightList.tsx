interface InsightListProps {
  title: string;
  items: string[];
  tone: 'positive' | 'caution';
}

export default function InsightList({ title, items, tone }: InsightListProps) {
  const fallback = tone === 'positive'
    ? ['The agent did not return a separate thesis list. Use the executive summary and factor analysis below.']
    : ['No separate monitoring list was returned. Review risk and valuation factors closely.'];

  return (
    <div className={`panel insight-panel ${tone}`}>
      <div className="section-kicker">{tone === 'positive' ? 'Upside Logic' : 'Due Diligence'}</div>
      <h2 className="section-heading">{title}</h2>
      <ul className="insight-list">
        {(items.length ? items : fallback).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
