import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/db';

export async function GET() {
  try {
    const history = await getHistory(20);
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('History fetch API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
