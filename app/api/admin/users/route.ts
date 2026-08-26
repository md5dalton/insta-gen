import { NextResponse } from 'next/server';
import { db } from '../../../src/server/db';
import { authenticateRequest } from '../../../src/server/auth';

export async function GET() {
  return NextResponse.json(db.profileUsers);
}

export async function POST(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, email, role, capability, avatarUrl } = await request.json();
  if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  const existing = db.profileUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
  const newUser: any = { id: `puser-${Date.now()}`, name, email: email.toLowerCase().trim(), role: role || 'USER', capability: capability || 'VIEW', avatarUrl, createdAt: new Date().toISOString() };
  db.profileUsers.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}

