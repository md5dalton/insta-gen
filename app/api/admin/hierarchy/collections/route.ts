import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db';
import { authenticateRequest } from '../../../../src/server/auth';

export async function POST(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rootCollectionId, name, path: dirPath, processingProfileId, visibility, allowedUserIds } = await request.json();
  if (!rootCollectionId || !name) return NextResponse.json({ error: 'rootCollectionId and name are required' }, { status: 400 });
  const rootExists = db.rootCollections.find((r) => r.id === rootCollectionId);
  if (!rootExists) return NextResponse.json({ error: 'Root Collection not found' }, { status: 404 });
  const cleanPath = dirPath ? dirPath.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCol: any = { id: `col-${Date.now()}`, rootCollectionId, name: name.trim(), path: cleanPath, processingProfileId: processingProfileId || null, visibility: visibility || null, allowedUserIds: allowedUserIds || [], deletedAt: null };
  db.collections.push(newCol);
  db.recentActivity.unshift({ id: `act-${Date.now()}`, type: 'POLICY_CHANGE', title: 'Collection created', description: `Created collection "${newCol.name}" under "${rootExists.name}"`, timestamp: new Date().toISOString() });
  return NextResponse.json(newCol, { status: 201 });
}
