import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db';
import { authenticateRequest } from '../../../../src/server/auth';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') || undefined;
  const admin = authenticateRequest(auth);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, action, payload } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Array of media IDs required' }, { status: 400 });
  }

  let updatedCount = 0;
  for (const id of ids) {
    const item = db.media.find((m) => m.id === id);
    if (!item) continue;
    if (action === 'PROCESS') {
      item.processingStatus = 'PROCESSING';
      item.processingStatus = 'READY';
      updatedCount++;
    } else if (action === 'RETRY') {
      item.processingStatus = 'READY';
      updatedCount++;
    } else if (action === 'SET_PROFILE') {
      item.processingProfileId = payload?.profileId || null;
      updatedCount++;
    } else if (action === 'SET_VISIBILITY') {
      item.visibility = payload?.visibility || null;
      if (payload?.allowedUserIds !== undefined) item.allowedUserIds = payload.allowedUserIds;
      updatedCount++;
    } else if (action === 'ADD_TAG') {
      if (payload?.tag && !item.tags.includes(payload.tag)) {
        item.tags.push(payload.tag);
        updatedCount++;
      }
    } else if (action === 'REMOVE_TAG') {
      if (payload?.tag) {
        item.tags = item.tags.filter((t) => t !== payload.tag);
        updatedCount++;
      }
    } else if (action === 'DELETE') {
      item.deletedAt = new Date().toISOString();
      updatedCount++;
    } else if (action === 'RESTORE') {
      item.deletedAt = null;
      updatedCount++;
    }
  }

  db.recentActivity.unshift({
    id: `act-${Date.now()}`,
    type: 'PROCESSED',
    title: `Bulk Action: ${action}`,
    description: `Applied ${action} across ${updatedCount} media items`,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, count: updatedCount });
}
