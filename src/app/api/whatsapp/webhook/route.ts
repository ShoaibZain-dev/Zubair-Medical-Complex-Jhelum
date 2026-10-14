import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// GET  — Meta Webhook Verification Challenge
// Meta calls this once when you register the webhook URL in the Developer portal.
// It sends ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
// We must echo hub.challenge back if our verify token matches.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error('[WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN is not set in environment variables.');
    return new NextResponse('Server configuration error: WHATSAPP_VERIFY_TOKEN not set.', { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Webhook verification successful.');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error(`[WhatsApp Webhook] Verification failed. Mode: ${mode}, Token match: ${token === verifyToken}`);
  return new NextResponse('Forbidden: verify token mismatch.', { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Incoming delivery status notifications from Meta
// Meta sends webhook events for: sent, delivered, read, failed statuses.
// We update the corresponding NotificationLog entry with the real status.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // ── Payload Signature Verification ──────────────────────────────────────
    // If WHATSAPP_APP_SECRET is configured, verify X-Hub-Signature-256 header
    // to confirm the request genuinely came from Meta (not forged).
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
      const signature = request.headers.get('x-hub-signature-256');
      if (!signature) {
        console.error('[WhatsApp Webhook] Missing X-Hub-Signature-256 header.');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        console.error('[WhatsApp Webhook] Signature verification failed.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody || '{}');
    await processWebhookPayload(body);

    // Meta requires a 200 OK response within 20 seconds or it will retry.
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Processing error:', error.message);
    // Still return 200 to prevent Meta from retrying a malformed payload
    return NextResponse.json({ status: 'error', error: error.message }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Internal: Process incoming Meta webhook payload
// ---------------------------------------------------------------------------
async function processWebhookPayload(body: any) {
  if (body.object !== 'whatsapp_business_account') {
    // Not a WhatsApp Business event — ignore silently
    return;
  }

  const entries: any[] = body.entry || [];

  for (const entry of entries) {
    const changes: any[] = entry.changes || [];

    for (const change of changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      if (!value) continue;

      // Process delivery status updates (sent/delivered/read/failed)
      const statuses: any[] = value.statuses || [];
      for (const statusObj of statuses) {
        await handleStatusUpdate(statusObj);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Map a Meta status event to our NotificationLog status and update storage
// ---------------------------------------------------------------------------
async function handleStatusUpdate(statusObj: any) {
  const {
    id: messageId,            // WhatsApp message ID (wamid.xxx)
    status,                   // "sent" | "delivered" | "read" | "failed"
    timestamp,
    recipient_id: recipientPhone,
    errors
  } = statusObj;

  if (!messageId || !status) return;

  // Map Meta status strings to our internal NotificationLog status
  const statusMap: Record<string, 'sent' | 'delivered' | 'failed'> = {
    sent:      'sent',
    delivered: 'delivered',
    read:      'delivered',   // "read" is a superset of delivered
    failed:    'failed'
  };

  const mappedStatus = statusMap[status];
  if (!mappedStatus) return;

  // Collect error details for failed messages
  let errorDetails: string | undefined;
  if (status === 'failed' && errors && errors.length > 0) {
    errorDetails = errors
      .map((e: any) => `[${e.code}] ${e.title}: ${e.message}`)
      .join('; ');
  }

  console.log(
    `[WhatsApp Webhook] Message ${messageId} → ${recipientPhone}: ${status}` +
    (errorDetails ? ` — ${errorDetails}` : '')
  );

  // Update the notification log entry with the real delivery status
  try {
    const deliveredAt = timestamp
      ? new Date(parseInt(timestamp, 10) * 1000).toISOString()
      : new Date().toISOString();

    const updated = storage.updateNotificationLogByMessageId(messageId, {
      status: mappedStatus,
      ...(errorDetails ? { error_details: errorDetails } : {}),
      delivered_at: deliveredAt
    });

    if (updated) {
      console.log(
        `[WhatsApp Webhook] ✓ Updated notification log for message ${messageId}: ${mappedStatus}`
      );
    } else {
      // Message ID not in our log yet — could be a status for a message sent
      // before this tracking was implemented, or a non-appointment message.
      console.log(
        `[WhatsApp Webhook] No notification log found for message ID: ${messageId} — ignoring.`
      );
    }
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Failed to update notification log:', err.message);
  }
}
