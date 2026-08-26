import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db';
import { authenticateRequest } from '../../../../src/server/auth';

export async function GET(request: any, context: any) {
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = db.profileUsers.find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(request: any, context: any) {
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = db.profileUsers.find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const { name, role, capability } = await request.json();
  if (name) user.name = name;
  if (role) user.role = role;
  if (capability) user.capability = capability;
  return NextResponse.json(user);
}

export async function DELETE(request: any, context: any) {
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const idx = db.profileUsers.findIndex((u) => u.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (db.profileUsers[idx].role === 'ADMIN' && db.profileUsers.filter((u) => u.role === 'ADMIN').length <= 1) {
    return NextResponse.json({ error: 'Cannot delete the primary administrator' }, { status: 400 });
  }
  const deleted = db.profileUsers.splice(idx, 1)[0];
  return NextResponse.json({ success: true, deleted });
}
