import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db';
import { authenticateRequest } from '../../../../src/server/auth';

export async function POST(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { collectionId, username, displayName, processingProfileId, visibility, allowedUserIds } = await request.json();
  if (!collectionId || !username) return NextResponse.json({ error: 'collectionId and username are required' }, { status: 400 });
  const colExists = db.collections.find((c) => c.id === collectionId);
  if (!colExists) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  const newUser: any = { id: `user-${Date.now()}`, collectionId, username: cleanUsername, displayName: displayName ? displayName.trim() : cleanUsername, processingProfileId: processingProfileId || null, visibility: visibility || null, allowedUserIds: allowedUserIds || [], deletedAt: null };
  db.mediaUsers.push(newUser);
  db.recentActivity.unshift({ id: `act-${Date.now()}`, type: 'POLICY_CHANGE', title: 'Media User registered', description: `Registered user "@${newUser.username}" under collection "${colExists.name}"`, timestamp: new Date().toISOString() });
  return NextResponse.json(newUser, { status: 201 });
}
