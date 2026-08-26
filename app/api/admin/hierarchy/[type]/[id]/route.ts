import { NextResponse } from 'next/server';
import { db } from '../../../../../src/server/db';
import { authenticateRequest } from '../../../../../src/server/auth';

export async function PUT(request: any, context: any) {
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, id } = params;
  const { processingProfileId, visibility, allowedUserIds, deleted } = await request.json();
  let target: any = null; let entityType = '';
  if (type === 'root') { target = db.rootCollections.find((r) => r.id === id); entityType = 'Root Collection'; }
  else if (type === 'collection') { target = db.collections.find((c) => c.id === id); entityType = 'Collection'; }
  else if (type === 'user') { target = db.mediaUsers.find((u) => u.id === id); entityType = 'Media User'; }
  if (!target) return NextResponse.json({ error: `${entityType || 'Entity'} not found` }, { status: 404 });
  if (processingProfileId !== undefined) target.processingProfileId = processingProfileId;
  if (visibility !== undefined) target.visibility = visibility;
  if (allowedUserIds !== undefined) target.allowedUserIds = allowedUserIds;
  if (deleted !== undefined) target.deletedAt = deleted ? new Date().toISOString() : null;
  db.recentActivity.unshift({ id: `act-${Date.now()}`, type: 'POLICY_CHANGE', title: `${entityType} policy modified`, description: `Updated configuration for "${target.name || target.username}"`, timestamp: new Date().toISOString() });
  return NextResponse.json({ success: true, target });
}
