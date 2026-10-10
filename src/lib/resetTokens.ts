import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  resetLink: string;
  token: string;
  sentAt: string;
  delivered: boolean;
}

export interface ResetTokenRecord {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

interface ResetStorageData {
  tokens: Record<string, ResetTokenRecord>;
  inbox: SimulatedEmail[];
}

const PRIMARY_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PRIMARY_STORAGE_FILE = path.join(PRIMARY_DATA_DIR, 'simulated_inbox.json');

const FALLBACK_STORAGE_FILE = path.join(os.tmpdir(), 'zmc_simulated_inbox.json');

let memoryResetData: ResetStorageData | null = null;

function ensureData(): ResetStorageData {
  if (memoryResetData) {
    return memoryResetData;
  }

  const initial: ResetStorageData = { tokens: {}, inbox: [] };

  try {
    if (fs.existsSync(FALLBACK_STORAGE_FILE)) {
      const raw = fs.readFileSync(FALLBACK_STORAGE_FILE, 'utf-8');
      memoryResetData = JSON.parse(raw);
      return memoryResetData!;
    }
  } catch {}

  try {
    if (fs.existsSync(PRIMARY_STORAGE_FILE)) {
      const raw = fs.readFileSync(PRIMARY_STORAGE_FILE, 'utf-8');
      memoryResetData = JSON.parse(raw);
      return memoryResetData!;
    }
  } catch {}

  memoryResetData = initial;
  return memoryResetData;
}

function saveData(data: ResetStorageData): void {
  memoryResetData = data;

  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return;
  } catch {}

  try {
    fs.writeFileSync(FALLBACK_STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save simulated inbox:', err);
  }
}

/**
 * Generate a cryptographically secure reset token for an email
 */
export function createResetToken(email: string): { token: string; resetLink: string; emailRecord: SimulatedEmail } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity

  const data = ensureData();

  data.tokens[token] = {
    token,
    email: email.toLowerCase(),
    expiresAt,
    used: false
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const emailRecord: SimulatedEmail = {
    id: `email-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    to: email,
    subject: '🔐 Zubair Medical Complex - Password Reset Link',
    body: `Hello,\n\nA password reset was requested for your Staff & Admin account at Zubair Medical Complex Jhelum.\n\nClick the link below to set a new password:\n${resetLink}\n\nThis link is valid for 60 minutes.\nIf you did not request this, please contact clinic security at +92 315 6621341 immediately.`,
    resetLink,
    token,
    sentAt: new Date().toISOString(),
    delivered: true
  };

  data.inbox.unshift(emailRecord);

  // Keep inbox at max 50 items
  if (data.inbox.length > 50) {
    data.inbox = data.inbox.slice(0, 50);
  }

  saveData(data);

  return { token, resetLink, emailRecord };
}

/**
 * Validate a reset token
 */
export function validateResetToken(token: string): { valid: boolean; email?: string; error?: string } {
  const data = ensureData();
  const record = data.tokens[token];

  if (!record) {
    return { valid: false, error: 'Reset token is invalid or does not exist.' };
  }

  if (record.used) {
    return { valid: false, error: 'This reset token has already been used. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, error: 'Reset link has expired (valid for 60 minutes). Please request a new link.' };
  }

  return { valid: true, email: record.email };
}

/**
 * Mark token as used
 */
export function markTokenUsed(token: string): void {
  const data = ensureData();
  if (data.tokens[token]) {
    data.tokens[token].used = true;
    saveData(data);
  }
}

/**
 * Get all simulated emails in the inbox
 */
export function getSimulatedInbox(filterEmail?: string): SimulatedEmail[] {
  const data = ensureData();
  if (filterEmail) {
    return data.inbox.filter(e => e.to.toLowerCase() === filterEmail.toLowerCase());
  }
  return data.inbox;
}

/**
 * Clear inbox (for testing)
 */
export function clearSimulatedInbox(): void {
  const data = ensureData();
  data.inbox = [];
  data.tokens = {};
  saveData(data);
}
