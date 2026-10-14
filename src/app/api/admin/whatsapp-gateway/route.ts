import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = 'http://localhost:5005';

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) {
      return NextResponse.json({ connected: false, error: 'Gateway returned error' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      gatewayRunning: false,
      message: 'WhatsApp Gateway service is starting or offline'
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${GATEWAY_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const res = await fetch(`${GATEWAY_URL}/logout`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
