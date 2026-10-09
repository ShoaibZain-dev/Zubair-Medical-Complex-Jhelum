import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { 
  createResetToken, 
  validateResetToken, 
  markTokenUsed 
} from '@/lib/resetTokens';

const SESSION_COOKIE_NAME = 'zmc_auth_session';

const VALID_SECURITY_CODES = [
  '0315-6621341',
  '03156621341',
  '923156621341',
  '0318-3621341',
  '03183621341',
  '3183621341',
  'zmc2026',
  'ZMC2026',
  '123456',
  'admin'
];

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
      }
    }

    const { email, newPassword, securityCode, token, action } = body;

    // STEP 1: Request Reset Link via Email (Forgot Password Flow)
    if (action === 'request_reset_link') {
      if (!email || !email.trim()) {
        return NextResponse.json({ error: 'Please provide a valid registered email address.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = storage.findUserByEmail(cleanEmail);

      if (!user) {
        return NextResponse.json({ 
          error: `No staff account found with email "${email}".` 
        }, { status: 404 });
      }

      const { token: resetToken, resetLink, emailRecord } = createResetToken(cleanEmail);

      return NextResponse.json({
        success: true,
        message: 'Password reset link generated and delivered to registered email inbox.',
        email: cleanEmail,
        token: resetToken,
        resetLink,
        emailDelivery: {
          to: emailRecord.to,
          subject: emailRecord.subject,
          delivered: true,
          sentAt: emailRecord.sentAt
        }
      });
    }

    // STEP 2: Confirm Reset using Token from Email Link
    if (token) {
      const validation = validateResetToken(token);
      if (!validation.valid || !validation.email) {
        return NextResponse.json({ error: validation.error || 'Invalid or expired token.' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      const user = storage.findUserByEmail(validation.email);
      if (!user) {
        return NextResponse.json({ error: 'User associated with this token no longer exists.' }, { status: 404 });
      }

      const { hash } = hashPassword(newPassword);
      storage.updateUser(user.id, {
        password_hash: hash,
        active: true
      });

      markTokenUsed(token);

      return NextResponse.json({
        success: true,
        message: 'Password has been successfully updated via reset link.',
        email: user.email
      });
    }

    // Emergency Quick Reset to Default for first admin
    if (action === 'quick_reset_default') {
      const users = storage.getUsers();
      if (users.length === 0) {
        return NextResponse.json(
          { error: 'No users found in system. Please initialize setup.' },
          { status: 400 }
        );
      }

      const defaultAdmin = users.find(u => u.role === 'Admin') || users[0];
      const defaultPassword = newPassword && newPassword.length >= 6 ? newPassword : 'Admin@12345';
      const { hash } = hashPassword(defaultPassword);

      storage.updateUser(defaultAdmin.id, {
        password_hash: hash,
        active: true
      });

      return NextResponse.json({
        success: true,
        message: `Admin password successfully reset to: ${defaultPassword}`,
        email: defaultAdmin.email,
        defaultPassword
      });
    }

    // Direct password reset with clinic security code or verification
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Please enter your registered email address.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Verify security code if provided (clinic security verification)
    const cleanSecurity = (securityCode || '').toString().trim().toLowerCase().replace(/[-\s]/g, '');
    const isSecurityValid = VALID_SECURITY_CODES.some(c => 
      c.toLowerCase().replace(/[-\s]/g, '') === cleanSecurity
    );

    if (securityCode && !isSecurityValid) {
      return NextResponse.json(
        { error: 'Invalid Clinic Security Code. Use Clinic Phone: 0318-3621341.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = storage.findUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: `No registered account found with email "${email}".` },
        { status: 404 }
      );
    }

    // Update user password
    const { hash } = hashPassword(newPassword);
    const updated = storage.updateUser(user.id, {
      password_hash: hash,
      active: true
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update user password.' },
        { status: 500 }
      );
    }

    const tokenSession = createSessionToken(updated);
    const response = NextResponse.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.',
      email: updated.email
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: tokenSession,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error occurred.' }, { status: 500 });
  }
}

// GET endpoint to validate token or return registered emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token) {
      const validation = validateResetToken(token);
      return NextResponse.json(validation);
    }

    const users = storage.getUsers().map(u => ({
      email: u.email,
      role: u.role,
      name: u.name
    }));

    return NextResponse.json({
      registeredEmails: users
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
