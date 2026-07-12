import { NextResponse } from 'next/server';
import { runResearchAgent } from '@/lib/agent';
import { saveReport } from '@/lib/db';

// Deeper multi-factor research may need extra time on serverless deployments.
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { company } = await request.json();

    if (!company || typeof company !== 'string' || company.trim() === '') {
      return NextResponse.json({ success: false, error: 'Company name is required.' }, { status: 400 });
    }

    const trimmedCompany = company.trim();
    console.log(`[API Route] Researching company: "${trimmedCompany}"`);

    // 1. Run the agent to research and generate decision
    const report = await runResearchAgent(trimmedCompany);

    // 2. Save the report to database
    console.log(`[API Route] Saving report to database for "${trimmedCompany}"`);
    const savedReport = await saveReport(report);

    return NextResponse.json({ success: true, data: savedReport });
  } catch (error: any) {
    console.error('Research API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred during investment research.' 
    }, { status: 500 });
  }
}
