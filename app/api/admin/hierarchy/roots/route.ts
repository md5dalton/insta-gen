import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db';
import { authenticateRequest } from '../../../../src/server/auth';

export async function POST(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, path: dirPath, processingProfileId, visibility, allowedUserIds } = await request.json();
  if (!name) return NextResponse.json({ error: 'Root Collection name is required' }, { status: 400 });
  const cleanPath = dirPath ? dirPath.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newRoot: any = { id: `root-${Date.now()}`, name: name.trim(), path: cleanPath, processingProfileId: processingProfileId || null, visibility: visibility || 'ALL_USERS', allowedUserIds: allowedUserIds || [], deletedAt: null };
  db.rootCollections.push(newRoot);
  db.recentActivity.unshift({ id: `act-${Date.now()}`, type: 'POLICY_CHANGE', title: 'Root Collection created', description: `Created root collection "${newRoot.name}"`, timestamp: new Date().toISOString() });
  return NextResponse.json(newRoot, { status: 201 });
}
