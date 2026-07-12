export type Decision = 'INVEST' | 'PASS';

export type FactorStatus = 'strong' | 'watch' | 'weak';

export interface FactorAnalysis {
  score: number;
  analysis: string;
  details: string[];
}

export interface ResearchFactor {
  key: string;
  label: string;
  score: number;
  status: FactorStatus;
  analysis: string;
  evidence: string[];
  implication: string;
}

export interface ResearchReport {
  company_name: string;
  decision: Decision;
  confidence: number;
  summary: string;
  investment_thesis: string[];
  watch_items: string[];
  factors: ResearchFactor[];
  key_metrics: Record<string, string>;
  sources: string[];
  raw_response: string;
}

export interface HistoryEntry extends ResearchReport {
  id: number;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
