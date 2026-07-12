import React from 'react';

interface SearchFormProps {
  company: string;
  setCompany: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  dbStatus: 'checking' | 'initialized' | 'error';
}

export default function SearchForm({
  company,
  setCompany,
  onSubmit,
  isLoading,
  dbStatus,
}: SearchFormProps) {
  return (
    <div className="glass-card search-card">
      <form onSubmit={onSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name or ticker, e.g. Nvidia, Apple, Tesla"
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
          {isLoading ? (
            <>
              <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '18px', height: '18px', marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)"></circle>
                <path d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
              </svg>
              Researching
            </>
          ) : (
            'Run Full Research'
          )}
        </button>
      </form>
    </div>
  );
}
