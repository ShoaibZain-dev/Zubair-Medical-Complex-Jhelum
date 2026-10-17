import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { spawn } from 'child_process';
import path from 'path';

function getGatewayUrl(): string {
  try {
    const settings = storage.getSettings();
    if (settings && settings.whatsapp_gateway_url && settings.whatsapp_gateway_url.trim()) {
      return settings.whatsapp_gateway_url.trim().replace(/\/+$/, '');
    }
  } catch {}
  return (process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:5005').replace(/\/+$/, '');
}

let isAutoStarting = false;

function tryAutoStartLocalGateway() {
  if (isAutoStarting) return;
  // Do not try to spawn on Vercel or cloud serverless
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return;

  try {
    isAutoStarting = true;
    const scriptPath = path.join(process.cwd(), 'scripts', 'whatsapp-gateway.mjs');
    const child = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd()
    });
    child.unref();
    setTimeout(() => { isAutoStarting = false; }, 8000);
  } catch (e) {
    isAutoStarting = false;
  }
}

export async function GET() {
  const gatewayUrl = getGatewayUrl();
  const isVercel = Boolean(process.env.VERCEL);

  try {
    const res = await fetch(`${gatewayUrl}/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) {
      return NextResponse.json({
        connected: false,
        gatewayRunning: false,
        gatewayUrl,
        isLiveProduction: isVercel,
        error: `Gateway returned status ${res.status}`
      }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      gatewayRunning: true,
      gatewayUrl,
      isLiveProduction: isVercel
    });
  } catch (err: any) {
    // If running on localhost and unreachable, attempt auto-start
    if (gatewayUrl.includes('localhost') || gatewayUrl.includes('127.0.0.1')) {
      tryAutoStartLocalGateway();
    }

    return NextResponse.json({
      connected: false,
      gatewayRunning: false,
      gatewayUrl,
      isLiveProduction: isVercel,
      message: 'WhatsApp Gateway service is offline or unreachable'
    });
  }
}

export async function POST(req: NextRequest) {
  const gatewayUrl = getGatewayUrl();

  try {
    const body = await req.json();

    // Check for manual start action
    if (body.action === 'start') {
      tryAutoStartLocalGateway();
      return NextResponse.json({ success: true, message: 'Initiated WhatsApp Gateway start.' });
    }

    // Check for refresh / reset action
    if (body.action === 'refresh' || body.action === 'reset') {
      try {
        const res = await fetch(`${gatewayUrl}/refresh-qr`, {
          method: 'POST',
          signal: AbortSignal.timeout(6000)
        });
        const data = await res.json();
        return NextResponse.json(data);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // Check for pairing-code action
    if (body.action === 'pairing-code') {
      try {
        const res = await fetch(`${gatewayUrl}/pairing-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: body.phone }),
          signal: AbortSignal.timeout(15000)
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // Check for disconnect action
    if (body.action === 'disconnect') {
      try {
        const res = await fetch(`${gatewayUrl}/logout`, {
          method: 'POST',
          signal: AbortSignal.timeout(6000)
        });
        const data = await res.json();
        return NextResponse.json(data);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    const res = await fetch(`${gatewayUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: `Could not reach WhatsApp Gateway at ${gatewayUrl}. Please ensure gateway is running.` 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { gatewayUrl } = body;

    if (!gatewayUrl || typeof gatewayUrl !== 'string') {
      return NextResponse.json({ error: 'Valid gatewayUrl is required' }, { status: 400 });
    }

    const cleanedUrl = gatewayUrl.trim().replace(/\/+$/, '');
    storage.updateSetting('whatsapp_gateway_url', cleanedUrl);

    return NextResponse.json({ success: true, gatewayUrl: cleanedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const gatewayUrl = getGatewayUrl();

  try {
    const res = await fetch(`${gatewayUrl}/logout`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
