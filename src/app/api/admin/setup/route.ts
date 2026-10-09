import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { hashPassword, createSessionToken } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'zmc_auth_session';

export async function GET() {
  try {
    const users = storage.getUsers();
    return NextResponse.json({
      needsSetup: users.length === 0,
      adminCount: users.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const users = storage.getUsers();
    if (users.length > 0) {
      return NextResponse.json(
        { error: 'Initial setup has already been completed. Please log in with existing credentials.' },
        { status: 403 }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const { hash } = hashPassword(password);

    const newAdmin = storage.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hash,
      role: 'Admin',
      active: true
    });

    const token = createSessionToken(newAdmin);

    const response = NextResponse.json({
      success: true,
      message: 'Initial Administrator Account created successfully.',
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
