interface SourcesListProps {
  sources: string[];
}

function getSourceLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function SourcesList({ sources }: SourcesListProps) {
  if (!sources.length) return null;

  return (
    <section className="sources-section panel">
      <div className="section-kicker">Audit Trail</div>
      <h2 className="section-heading">Sources Reviewed</h2>
      <div className="sources-container">
        {sources.map((source) => (
          <a key={source} href={source} target="_blank" rel="noopener noreferrer" title={source}>
            {getSourceLabel(source)}
          </a>
        ))}
      </div>
    </section>
  );
}
