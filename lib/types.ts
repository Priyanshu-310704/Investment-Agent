export interface ResearchReport {
  company_name: string;
  decision: 'INVEST' | 'PASS';
  confidence: number;
  summary: string;
  bull_case: string[];
  bear_case: string[];
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
