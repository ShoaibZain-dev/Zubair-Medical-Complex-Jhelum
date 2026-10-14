import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_DIR = path.join(__dirname, '..', 'whatsapp_session');

const PORT = 5005;

let sock = null;
let currentQrDataUrl = null;
let currentQrRaw = null;
let isConnected = false;
let connectedUser = null;
let isStarting = false;

// Normalize Pakistani / International phone to JID (e.g. 923001234567@s.whatsapp.net)
function formatToJid(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.slice(1);
  } else if (digits.startsWith('3') && digits.length === 10) {
    digits = '92' + digits;
  }
  return `${digits}@s.whatsapp.net`;
}

async function startWhatsApp() {
  if (isStarting) return;
  isStarting = true;

  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Zubair Medical Complex', 'Chrome', '120.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrRaw = qr;
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        } catch (e) {
          console.error('QR code generation error:', e);
        }

        console.log('\n=============================================================');
        console.log('  📱 ZUBAIR MEDICAL COMPLEX: WHATSAPP WEB QR CODE');
        console.log('  Open WhatsApp on phone > Linked Devices > Link a Device > Scan:');
        console.log('=============================================================');
        qrcodeTerminal.generate(qr, { small: true });
        console.log('=============================================================\n');
      }

      if (connection === 'close') {
        isConnected = false;
        connectedUser = null;
        currentQrDataUrl = null;
        currentQrRaw = null;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Gateway] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[WhatsApp Gateway] Logged out. Clearing session directory...');
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch {}
        }

        isStarting = false;
        if (shouldReconnect) {
          setTimeout(() => startWhatsApp(), 3000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        isStarting = false;
        currentQrDataUrl = null;
        currentQrRaw = null;
        connectedUser = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';

        console.log('\n=============================================================');
        console.log(`  ✅ WHATSAPP WEB CONNECTED SUCCESSFULLY!`);
        console.log(`  Account Phone: +${connectedUser}`);
        console.log(`  Now automatic WhatsApp messages will be sent to patients.`);
        console.log('=============================================================\n');
      }
    });
  } catch (err) {
    isStarting = false;
    console.error('[WhatsApp Gateway] Init error:', err);
    setTimeout(() => startWhatsApp(), 5000);
  }
}

// HTTP Server for API calls from Next.js
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /status
  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      connected: isConnected,
      user: connectedUser,
      qr: currentQrDataUrl,
      hasQr: !!currentQrDataUrl
    }));
    return;
  }

  // POST /send
  if (req.method === 'POST' && url.pathname === '/send') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const { to, message } = body;

        if (!to || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Parameters "to" and "message" are required.' }));
          return;
        }

        if (!isConnected || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'WhatsApp Web is not connected. Please scan QR code in terminal or dashboard.',
            connected: false
          }));
          return;
        }

        const jid = formatToJid(to);
        const sent = await sock.sendMessage(jid, { text: message });

        console.log(`[WhatsApp Gateway] Successfully sent message to ${to} (${jid})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, messageId: sent.key?.id, to: jid }));
      } catch (sendErr) {
        console.error('[WhatsApp Gateway] Send error:', sendErr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: sendErr.message }));
      }
    });
    return;
  }

  // POST /logout
  if (req.method === 'POST' && url.pathname === '/logout') {
    try {
      if (sock) {
        await sock.logout().catch(() => {});
      }
      try {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      } catch {}
      isConnected = false;
      connectedUser = null;
      setTimeout(() => startWhatsApp(), 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Logged out. Generating fresh QR...' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[WhatsApp Gateway HTTP Server] Listening on http://localhost:${PORT}`);
  startWhatsApp();
});
