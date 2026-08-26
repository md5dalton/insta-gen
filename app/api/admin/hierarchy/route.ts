import { NextResponse } from 'next/server';
import { db } from '../../../src/server/db';
import { enrichMediaItem } from '../../../src/server/policy';
import { authenticateRequest } from '../../../src/server/auth';

export async function GET(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const enrichedMedia = db.media.map(enrichMediaItem);
  const roots = db.rootCollections.map((root) => {
    const rootCols = db.collections.filter((c) => c.rootCollectionId === root.id);
    const collections = rootCols.map((col) => {
      const colUsers = db.mediaUsers.filter((u) => u.collectionId === col.id);
      const users = colUsers.map((user) => {
        const userMedia = enrichedMedia.filter((m) => m.userId === user.id);
        return { ...user, effectiveProfile: null, effectiveVisibility: 'ALL_USERS', effectiveAllowedUserIds: [], isEffectivelyDeleted: false, mediaCount: userMedia.length, activeMediaCount: userMedia.filter((m) => !m.isEffectivelyDeleted).length };
      });
      const colMedia = enrichedMedia.filter((m) => m.collectionId === col.id);
      return { ...col, effectiveProfile: null, effectiveVisibility: 'ALL_USERS', effectiveAllowedUserIds: [], isEffectivelyDeleted: false, users, mediaCount: colMedia.length, activeMediaCount: colMedia.filter((m) => !m.isEffectivelyDeleted).length };
    });
    const rootMedia = enrichedMedia.filter((m) => m.rootCollectionId === root.id);
    return { ...root, effectiveProfile: null, effectiveVisibility: 'ALL_USERS', effectiveAllowedUserIds: [], isEffectivelyDeleted: false, collections, mediaCount: rootMedia.length, activeMediaCount: rootMedia.filter((m) => !m.isEffectivelyDeleted).length };
  });
  return NextResponse.json({ roots });
}

