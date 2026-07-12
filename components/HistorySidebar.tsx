import React from 'react';
import { HistoryEntry } from '@/lib/types';

interface HistorySidebarProps {
  history: HistoryEntry[];
  currentReportId?: number;
  onSelect: (item: HistoryEntry) => void;
  isLoading: boolean;
}

export default function HistorySidebar({
  history,
  currentReportId,
  onSelect,
  isLoading,
}: HistorySidebarProps) {
  return (
    <div className="glass-card history-shell">
      <h3 className="history-section-title">Research History</h3>
      <div className="history-list">
        {history.length > 0 ? (
          history.map((item) => {
            const isActive = currentReportId === item.id;
            const averageFactor = item.factors?.length
              ? Math.round(item.factors.reduce((total, factor) => total + factor.score, 0) / item.factors.length)
              : item.confidence;

            return (
              <div
                key={item.id}
                onClick={() => !isLoading && onSelect(item)}
                className={`history-card ${isActive ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                <div className="history-card-header">
                  <span className="history-company">{item.company_name}</span>
                  <span className={`history-decision ${item.decision.toLowerCase()}`}>
                    {item.decision}
                  </span>
                </div>
                <div className="history-meta">
                  <span>Factor avg: {averageFactor}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="empty-state">No research history found.</p>
        )}
      </div>
    </div>
  );
}
