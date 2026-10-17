import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { isSuperAdmin, UserRole } from '@/types';

export async function GET() {
  try {
    const session = getSessionUser();
    if (!session || !isSuperAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const users = storage.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      created_at: u.created_at
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || !isSuperAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = storage.findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 409 });
    }

    const validRoles: UserRole[] = ['Super Admin', 'Hospital Admin', 'Staff', 'Admin', 'Receptionist'];
    const assignedRole: UserRole = validRoles.includes(role) ? role : 'Staff';

    const { hash } = hashPassword(password);

    const newUser = storage.createUser({
      name: name.trim(),
      email: cleanEmail,
      password_hash: hash,
      role: assignedRole,
      active: true
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: newUser.active,
      created_at: newUser.created_at
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || !isSuperAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, active, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.trim().toLowerCase();
    if (role) {
      const validRoles: UserRole[] = ['Super Admin', 'Hospital Admin', 'Staff', 'Admin', 'Receptionist'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid user role specified.' }, { status: 400 });
      }
      updates.role = role;
    }
    if (active !== undefined) updates.active = Boolean(active);

    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
      }
      const { hash } = hashPassword(password);
      updates.password_hash = hash;
    }

    try {
      const updatedUser = storage.updateUser(id, updates);
      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      return NextResponse.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        active: updatedUser.active,
        created_at: updatedUser.created_at
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || !isSuperAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (id === session.userId) {
      return NextResponse.json({ 
        error: 'You cannot delete your own active administrator account. To hand over ownership, log in as the other Super Admin first.' 
      }, { status: 400 });
    }

    try {
      const success = storage.deleteUser(id);
      if (!success) {
        return NextResponse.json({ error: 'User not found or could not be removed.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'User account removed.' });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
