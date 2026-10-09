import { NextRequest, NextResponse } from 'next/server';
import { getSimulatedInbox, clearSimulatedInbox } from '@/lib/resetTokens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const emails = getSimulatedInbox(email || undefined);

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
      latestEmail: emails[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearSimulatedInbox();
    return NextResponse.json({ success: true, message: 'Simulated inbox cleared.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
