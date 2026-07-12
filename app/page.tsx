'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HistoryEntry } from '@/lib/types';

export default function Home() {
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'initialized' | 'error'>('checking');
  
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    'Initializing research agent...',
    '🔍 Searching web for recent news & stock performance...',
    '📊 Analyzing financial statements & metrics...',
    '🧠 Formulating Invest/Pass decision & synthesis...'
  ];

  // Initialize DB and fetch history on mount
  useEffect(() => {
    async function initAndFetch() {
      try {
        // 1. Silent database initialization
        const initRes = await fetch('/api/init-db', { method: 'POST' });
        const initData = await initRes.json();
        if (initData.success) {
          setDbStatus('initialized');
        } else {
          console.error('DB initialization failed:', initData.error);
          setDbStatus('error');
        }

        // 2. Fetch history
        await fetchHistory();
      } catch (err) {
        console.error('Error during initial setup:', err);
        setDbStatus('error');
      }
    }
    initAndFetch();

    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.success && json.data) {
        setHistory(json.data);
        // Default to showing the latest report if available
        if (json.data.length > 0 && !report) {
          setReport(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const startStepAnimation = () => {
    setCurrentStep(0);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    
    stepIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev; // hold on the last step until API resolves
      });
    }, 6000); // progress step every 6 seconds to match agent pace
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    setIsLoading(true);
    setError(null);
    startStepAnimation();

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim() }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'The research agent failed to generate a report.');
      }

      setReport(json.data);
      // Prepend to history and fetch latest to sync
      setHistory(prev => [json.data, ...prev.filter(h => h.id !== json.data.id)]);
      setCompany('');
    } catch (err: any) {
      console.error('Error conducting research:', err);
      setError(err.message || 'An unexpected error occurred while researching.');
    } finally {
      setIsLoading(false);
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    }
  };

  const selectHistoryItem = (item: HistoryEntry) => {
    if (isLoading) return; // prevent navigating away while loading
    setReport(item);
    setError(null);
  };

  const handleRetryDb = async () => {
    setDbStatus('checking');
    try {
      const initRes = await fetch('/api/init-db', { method: 'POST' });
      const initData = await initRes.json();
      if (initData.success) {
        setDbStatus('initialized');
        fetchHistory();
      } else {
        setDbStatus('error');
      }
    } catch (err) {
      setDbStatus('error');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">AI Investment Research Agent</h1>
        <p className="app-subtitle">
          An autonomous analyst powered by Groq and LangChain that researches companies on the web, retrieves financials, and outputs structured invest/pass decisions.
        </p>
      </header>

      {/* Database Warning */}
      {dbStatus === 'error' && (
        <div className="error-card" style={{ marginBottom: '2rem' }}>
          <h3 className="error-title">Database Connection Error</h3>
          <p className="error-msg">
            Could not connect to Neon Postgres. Make sure <code>DATABASE_URL</code> is correctly set in your environment variables.
          </p>
          <button className="retry-btn" onClick={handleRetryDb}>Retry Connecting</button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="main-layout">
        {/* Left Side: Search & Analysis Results */}
        <div>
          {/* Search bar */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company name (e.g. Nvidia, Apple, Tesla)..."
                  className="search-input"
                  disabled={isLoading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="search-btn" 
                disabled={isLoading || dbStatus === 'error'}
              >
                {isLoading ? 'Researching...' : 'Run Analysis'}
              </button>
            </form>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="glass-card loading-container">
              <div className="loading-spinner"></div>
              <h2 className="loading-title">Agent At Work</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Please wait. The agent conducts several web searches to analyze the company thoroughly.
              </p>
              
              <div className="progress-steps">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;
                  return (
                    <div 
                      key={idx} 
                      className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className="progress-icon">
                        {isCompleted ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : isActive ? (
                          <div className="pulse-dot"></div>
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-tertiary)' }}></div>
                        )}
                      </div>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error display */}
          {error && !isLoading && (
            <div className="glass-card error-card">
              <h3 className="error-title">Research Failed</h3>
              <p className="error-msg">{error}</p>
              <button className="retry-btn" onClick={() => setError(null)}>Clear Error</button>
            </div>
          )}

          {/* Results display */}
          {report && !isLoading && !error && (
            <article className="glass-card">
              <div className="result-header">
                <div>
                  <h2 className="company-name">{report.company_name}</h2>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Analyzed on {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="badge-wrapper">
                  <div className={`decision-badge ${report.decision.toLowerCase()}`}>
                    {report.decision}
                  </div>
                  <div className="confidence-ring">
                    <span className="confidence-label">Confidence</span>
                    <span className="confidence-value">{report.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="summary-section">
                <h3 className="section-title">Executive Summary</h3>
                <p className="summary-text">{report.summary}</p>
              </div>

              {/* Bull & Bear Cases */}
              <div className="case-grid">
                <div className="case-card bull">
                  <h4 className="case-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.3rem' }}>
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Investment Thesis (Bull Case)
                  </h4>
                  <ul className="case-list">
                    {report.bull_case.length > 0 ? (
                      report.bull_case.map((bullet, idx) => (
                        <li key={idx} className="case-item">{bullet}</li>
                      ))
                    ) : (
                      <li className="case-item">No explicit bull points generated.</li>
                    )}
                  </ul>
                </div>

                <div className="case-card bear">
                  <h4 className="case-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.3rem' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Risk Factors (Bear Case)
                  </h4>
                  <ul className="case-list">
                    {report.bear_case.length > 0 ? (
                      report.bear_case.map((bullet, idx) => (
                        <li key={idx} className="case-item">{bullet}</li>
                      ))
                    ) : (
                      <li className="case-item">No explicit risk factors generated.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Key Metrics */}
              {Object.keys(report.key_metrics).length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <h3 className="section-title">Key Financials & Metrics</h3>
                  <div className="metrics-grid">
                    {Object.entries(report.key_metrics).map(([key, val], idx) => (
                      <div key={idx} className="metric-tile">
                        <span className="metric-name">{key}</span>
                        <span className="metric-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {report.sources.length > 0 && (
                <div>
                  <h3 className="section-title">Information Sources</h3>
                  <div className="sources-container">
                    {report.sources.map((url, idx) => {
                      let displayName = url;
                      try {
                        const parsed = new URL(url);
                        displayName = parsed.hostname.replace('www.', '');
                      } catch (e) {}
                      return (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="source-pill"
                          title={url}
                        >
                          {displayName}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          )}

          {/* Empty state */}
          {!report && !isLoading && !error && (
            <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Analysis Loaded</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                Enter a company name above to invoke the agent, or select a previous run from the history panel.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar History */}
        <aside className="glass-card" style={{ height: 'fit-content' }}>
          <h3 className="history-section-title">Research History</h3>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((item) => {
                const isActive = report && report.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => selectHistoryItem(item)}
                    className={`history-card ${isActive ? 'active' : ''}`}
                  >
                    <div className="history-card-header">
                      <span className="history-company">{item.company_name}</span>
                      <span className={`history-decision ${item.decision.toLowerCase()}`}>
                        {item.decision}
                      </span>
                    </div>
                    <div className="history-meta">
                      <span>Conf: {item.confidence}%</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No research history found.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
