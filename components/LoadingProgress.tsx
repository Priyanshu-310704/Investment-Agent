import React from 'react';

interface LoadingProgressProps {
  currentStep: number;
  steps: string[];
}

export default function LoadingProgress({ currentStep, steps }: LoadingProgressProps) {
  return (
    <div className="glass-card loading-container">
      <div className="loading-spinner"></div>
      <h2 className="loading-title">Building the Research Dashboard</h2>
      <p className="loading-copy">
        The analyst is running separate searches for financials, valuation, development, competition,
        governance, and risk. Deeper reports can take about a minute.
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--accent-green)' }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : isActive ? (
                  <div className="pulse-dot"></div>
                ) : (
                  <div className="idle-dot"></div>
                )}
              </div>
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
