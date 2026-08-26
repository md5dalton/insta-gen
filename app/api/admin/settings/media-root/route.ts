import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db';
import { authenticateRequest } from '../../../../src/server/auth';

export async function POST(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { path } = await request.json();
  if (!path || typeof path !== 'string') return NextResponse.json({ error: 'Valid path string is required' }, { status: 400 });
  const oldPath = db.settings.mediaRoot;
  db.settings.mediaRoot = path.trim();
  db.recentActivity.unshift({ id: `act-${Date.now()}`, type: 'POLICY_CHANGE', title: 'Media Root Path updated', description: `Target changed from "${oldPath}" to "${path}"`, timestamp: new Date().toISOString() });
  return NextResponse.json({ success: true, warning: 'Changing the media root does not move existing media. The system will now scan this path.', settings: db.settings });
}
