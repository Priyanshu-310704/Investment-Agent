'use client';

import React, { useEffect, useRef, useState } from 'react';
import HistorySidebar from '@/components/HistorySidebar';
import LoadingProgress from '@/components/LoadingProgress';
import ReportDisplay from '@/components/ReportDisplay';
import SearchForm from '@/components/SearchForm';
import { HistoryEntry } from '@/lib/types';

const researchSteps = [
  'Initializing analyst workflow',
  'Researching business model, products, and market position',
  'Collecting financial health, valuation, and peer signals',
  'Checking development pipeline, governance, and sentiment',
  'Stress-testing risks and compiling the final dashboard',
];

export default function Home() {
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'initialized' | 'error'>('checking');
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.success && json.data) {
        setHistory(json.data);
        setReport((current) => current ?? json.data[0] ?? null);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    async function initAndFetch() {
      try {
        const initRes = await fetch('/api/init-db', { method: 'POST' });
        const initData = await initRes.json();
        setDbStatus(initData.success ? 'initialized' : 'error');
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

  const startStepAnimation = () => {
    setCurrentStep(0);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);

    stepIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, researchSteps.length - 1));
    }, 9000);
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
      setHistory((prev) => [json.data, ...prev.filter((item) => item.id !== json.data.id)]);
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

  const handleRetryDb = async () => {
    setDbStatus('checking');
    try {
      const initRes = await fetch('/api/init-db', { method: 'POST' });
      const initData = await initRes.json();
      setDbStatus(initData.success ? 'initialized' : 'error');
      if (initData.success) fetchHistory();
    } catch {
      setDbStatus('error');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-badge">INSIDEIIM RESEARCH DESK</div>
        <h1 className="app-title">Investment Research Workbench</h1>
        <p className="app-subtitle">
          A multi-factor analyst dashboard covering business quality, financial health, valuation,
          development, market position, risk, and governance.
        </p>
      </header>

      {dbStatus === 'error' && (
        <div className="error-card">
          <h3 className="error-title">Database Connection Error</h3>
          <p className="error-msg">
            Could not connect to Neon Postgres. Verify <code>DATABASE_URL</code> in <code>.env.local</code>.
          </p>
          <button className="retry-btn" onClick={handleRetryDb}>Retry Connection</button>
        </div>
      )}

      <div className="main-layout">
        <main className="main-content-panel">
          <SearchForm
            company={company}
            setCompany={setCompany}
            onSubmit={handleSearch}
            isLoading={isLoading}
            dbStatus={dbStatus}
          />

          {isLoading && <LoadingProgress currentStep={currentStep} steps={researchSteps} />}

          {error && !isLoading && (
            <div className="glass-card error-card">
              <h3 className="error-title">Research Operation Failed</h3>
              <p className="error-msg">{error}</p>
              <button className="retry-btn danger" onClick={() => setError(null)}>Clear Error</button>
            </div>
          )}

          {report && !isLoading && !error && <ReportDisplay report={report} />}

          {!report && !isLoading && !error && (
            <div className="glass-card empty-report text-center">
              <div className="empty-report-mark">IR</div>
              <h3>No Active Research Report</h3>
              <p>
                Enter a company name to generate a full analyst-style dashboard, or select a prior run from history.
              </p>
            </div>
          )}
        </main>

        <aside className="sidebar-panel">
          <HistorySidebar
            history={history}
            currentReportId={report?.id}
            onSelect={(item) => {
              setReport(item);
              setError(null);
            }}
            isLoading={isLoading}
          />
        </aside>
      </div>
    </div>
  );
}
