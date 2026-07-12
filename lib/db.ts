import { neon } from '@neondatabase/serverless';
import { HistoryEntry, ResearchReport } from './types';
import { legacyFactorsToResearchFactors, normalizeFactors } from './report-utils';

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
        investment_thesis TEXT,
        watch_items TEXT,
        factors_json TEXT,
        key_metrics TEXT,
        sources TEXT,
        raw_response TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS investment_thesis TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS watch_items TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS factors_json TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS key_metrics TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS sources TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS raw_response TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS business_analysis TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS financial_analysis TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS development_analysis TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS risk_analysis TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS bull_case TEXT`;
    await sql`ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS bear_case TEXT`;

    return { success: true, message: 'Database initialized successfully.' };
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return { success: false, error: error.message || 'Unknown error occurred.' };
  }
}

export async function saveReport(report: ResearchReport): Promise<HistoryEntry> {
  const initResult = await initDatabase();
  if (!initResult.success) {
    throw new Error(initResult.error || 'Database initialization failed.');
  }

  const sql = getSql();
  const factorsJson = JSON.stringify(report.factors);
  const thesisJson = JSON.stringify(report.investment_thesis);
  const watchItemsJson = JSON.stringify(report.watch_items);
  const keyMetricsJson = JSON.stringify(report.key_metrics);
  const sourcesJson = JSON.stringify(report.sources);

  const result = await sql`
    INSERT INTO research_reports (
      company_name,
      decision,
      confidence,
      summary,
      investment_thesis,
      watch_items,
      factors_json,
      key_metrics,
      sources,
      raw_response
    ) VALUES (
      ${report.company_name},
      ${report.decision},
      ${report.confidence},
      ${report.summary},
      ${thesisJson},
      ${watchItemsJson},
      ${factorsJson},
      ${keyMetricsJson},
      ${sourcesJson},
      ${report.raw_response}
    )
    RETURNING id, created_at
  `;

  return {
    ...report,
    id: result[0].id,
    created_at: result[0].created_at,
  };
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Error parsing stored report JSON:', error);
    return fallback;
  }
}

export async function getHistory(limit = 20): Promise<HistoryEntry[]> {
  const initResult = await initDatabase();
  if (!initResult.success) {
    throw new Error(initResult.error || 'Database initialization failed.');
  }

  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM research_reports
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row: any) => {
    const legacyFactors = legacyFactorsToResearchFactors({
      business: parseJson(row.business_analysis, undefined),
      financials: parseJson(row.financial_analysis, undefined),
      development: parseJson(row.development_analysis, undefined),
      risks: parseJson(row.risk_analysis, undefined),
    });

    return {
      id: row.id,
      company_name: row.company_name,
      decision: row.decision === 'INVEST' ? 'INVEST' : 'PASS',
      confidence: row.confidence,
      summary: row.summary || '',
      investment_thesis: parseJson(row.investment_thesis, []),
      watch_items: parseJson(row.watch_items, []),
      factors: row.factors_json
        ? normalizeFactors(parseJson(row.factors_json, []))
        : legacyFactors,
      key_metrics: parseJson(row.key_metrics, {}),
      sources: parseJson(row.sources, []),
      raw_response: row.raw_response || '',
      created_at: row.created_at,
    };
  });
}
