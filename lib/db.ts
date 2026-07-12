import { neon } from '@neondatabase/serverless';
import { ResearchReport, HistoryEntry } from './types';

// Use DATABASE_URL or POSTGRES_URL which Vercel auto-sets
const getSql = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('Database connection string is missing. Please set DATABASE_URL or POSTGRES_URL.');
  }
  return neon(connectionString);
};

export async function initDatabase() {
  try {
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS research_reports (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        decision VARCHAR(10) NOT NULL,
        confidence INTEGER DEFAULT 0,
        summary TEXT,
        bull_case TEXT,
        bear_case TEXT,
        key_metrics TEXT,
        sources TEXT,
        raw_response TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    return { success: true, message: 'Database initialized successfully.' };
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return { success: false, error: error.message || 'Unknown error occurred.' };
  }
}

export async function saveReport(report: ResearchReport): Promise<HistoryEntry> {
  const sql = getSql();
  
  const bullCaseJson = JSON.stringify(report.bull_case);
  const bearCaseJson = JSON.stringify(report.bear_case);
  const keyMetricsJson = JSON.stringify(report.key_metrics);
  const sourcesJson = JSON.stringify(report.sources);

  const result = await sql`
    INSERT INTO research_reports (
      company_name,
      decision,
      confidence,
      summary,
      bull_case,
      bear_case,
      key_metrics,
      sources,
      raw_response
    ) VALUES (
      ${report.company_name},
      ${report.decision},
      ${report.confidence},
      ${report.summary},
      ${bullCaseJson},
      ${bearCaseJson},
      ${keyMetricsJson},
      ${sourcesJson},
      ${report.raw_response}
    )
    RETURNING id, created_at
  `;

  return {
    ...report,
    id: result[0].id,
    created_at: result[0].created_at
  };
}

export async function getHistory(limit = 20): Promise<HistoryEntry[]> {
  const sql = getSql();
  
  const rows = await sql`
    SELECT * FROM research_reports
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row: any) => {
    let bull_case: string[] = [];
    let bear_case: string[] = [];
    let key_metrics: Record<string, string> = {};
    let sources: string[] = [];

    try {
      bull_case = row.bull_case ? JSON.parse(row.bull_case) : [];
    } catch (e) {
      console.error('Error parsing bull_case JSON:', e);
    }

    try {
      bear_case = row.bear_case ? JSON.parse(row.bear_case) : [];
    } catch (e) {
      console.error('Error parsing bear_case JSON:', e);
    }

    try {
      key_metrics = row.key_metrics ? JSON.parse(row.key_metrics) : {};
    } catch (e) {
      console.error('Error parsing key_metrics JSON:', e);
    }

    try {
      sources = row.sources ? JSON.parse(row.sources) : [];
    } catch (e) {
      console.error('Error parsing sources JSON:', e);
    }

    return {
      id: row.id,
      company_name: row.company_name,
      decision: row.decision as 'INVEST' | 'PASS',
      confidence: row.confidence,
      summary: row.summary,
      bull_case,
      bear_case,
      key_metrics,
      sources,
      raw_response: row.raw_response,
      created_at: row.created_at
    };
  });
}
