import { FactorAnalysis, FactorStatus, ResearchFactor, ResearchReport } from './types';

const DEFAULT_FACTORS: Array<Pick<ResearchFactor, 'key' | 'label'>> = [
  { key: 'business', label: 'Business Quality' },
  { key: 'financials', label: 'Financial Health' },
  { key: 'valuation', label: 'Valuation Discipline' },
  { key: 'development', label: 'Development Pipeline' },
  { key: 'market', label: 'Market Position' },
  { key: 'risks', label: 'Risk Control' },
  { key: 'sentiment', label: 'Sentiment & Governance' },
];

const LEGACY_FACTOR_LABELS: Record<string, string> = {
  business: 'Business Quality',
  financials: 'Financial Health',
  development: 'Development Pipeline',
  risks: 'Risk Control',
};

export function clampScore(value: unknown, fallback = 50) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function statusFromScore(score: number): FactorStatus {
  if (score >= 72) return 'strong';
  if (score >= 48) return 'watch';
  return 'weak';
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFactor(value: unknown, fallback: Pick<ResearchFactor, 'key' | 'label'>): ResearchFactor {
  const factor = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const score = clampScore(factor.score);
  const evidence = cleanStringArray(factor.evidence ?? factor.details);

  return {
    key: typeof factor.key === 'string' && factor.key.trim() ? factor.key.trim() : fallback.key,
    label: typeof factor.label === 'string' && factor.label.trim() ? factor.label.trim() : fallback.label,
    score,
    status: factor.status === 'strong' || factor.status === 'watch' || factor.status === 'weak'
      ? factor.status
      : statusFromScore(score),
    analysis: typeof factor.analysis === 'string' && factor.analysis.trim()
      ? factor.analysis.trim()
      : 'The agent did not provide a written analysis for this factor.',
    evidence,
    implication: typeof factor.implication === 'string' && factor.implication.trim()
      ? factor.implication.trim()
      : 'Monitor this factor as part of the final investment decision.',
  };
}

export function normalizeFactors(value: unknown): ResearchFactor[] {
  const rawFactors = Array.isArray(value) ? value : [];
  const factorsByKey = new Map<string, ResearchFactor>();

  rawFactors.forEach((item, index) => {
    const fallback = DEFAULT_FACTORS[index] ?? {
      key: `factor_${index + 1}`,
      label: `Research Factor ${index + 1}`,
    };
    const factor = normalizeFactor(item, fallback);
    factorsByKey.set(factor.key, factor);
  });

  DEFAULT_FACTORS.forEach((fallback) => {
    if (!factorsByKey.has(fallback.key)) {
      factorsByKey.set(fallback.key, normalizeFactor(null, fallback));
    }
  });

  return Array.from(factorsByKey.values());
}

export function legacyFactorsToResearchFactors(legacy: Record<string, FactorAnalysis | undefined>) {
  const factors = Object.entries(legacy)
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      key,
      label: LEGACY_FACTOR_LABELS[key] ?? key,
      score: value?.score ?? 50,
      status: statusFromScore(value?.score ?? 50),
      analysis: value?.analysis ?? '',
      evidence: value?.details ?? [],
      implication: key === 'risks'
        ? 'Higher scores indicate lower concern after considering the listed risk items.'
        : 'Use this factor to judge the durability of the recommendation.',
    }));

  return normalizeFactors(factors);
}

export function normalizeReportPayload(payload: Record<string, unknown>, companyName: string, rawResponse: string): ResearchReport {
  const decision = payload.decision === 'INVEST' ? 'INVEST' : 'PASS';
  const metrics = typeof payload.key_metrics === 'object' && payload.key_metrics !== null
    ? Object.fromEntries(
      Object.entries(payload.key_metrics as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
        .map(([key, value]) => [key, String(value)])
    )
    : {};

  return {
    company_name: typeof payload.company_name === 'string' && payload.company_name.trim()
      ? payload.company_name.trim()
      : companyName,
    decision,
    confidence: clampScore(payload.confidence),
    summary: typeof payload.summary === 'string' && payload.summary.trim()
      ? payload.summary.trim()
      : 'No executive summary was provided.',
    investment_thesis: cleanStringArray(payload.investment_thesis),
    watch_items: cleanStringArray(payload.watch_items),
    factors: normalizeFactors(payload.factors),
    key_metrics: metrics,
    sources: cleanStringArray(payload.sources),
    raw_response: rawResponse,
  };
}
