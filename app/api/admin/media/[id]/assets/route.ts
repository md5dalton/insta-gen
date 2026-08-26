import { NextResponse } from 'next/server';
import { db } from '../../../../../src/server/db';
import { authenticateRequest } from '../../../../../src/server/auth';

export async function GET(request: any, context: any) {
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const id = params.id;
  const item = db.media.find((m) => m.id === id);
  if (!item) return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  return NextResponse.json(item.assets || []);
}

export async function POST(request: any, context: any) {
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = params.id;
  const item = db.media.find((m) => m.id === id);
  if (!item) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

  const body = await request.json();
  const { type, status = 'READY', path, size, error } = body;
  if (!type) return NextResponse.json({ error: 'Asset type is required' }, { status: 400 });

  const existingIdx = item.assets.findIndex((a) => a.type === type);
  const asset: any = {
    id: existingIdx >= 0 ? item.assets[existingIdx].id : `asset-${item.id}-${Date.now()}`,
    mediaId: item.id,
    type,
    status,
    path,
    size,
    error,
    generatedAt: status === 'READY' ? new Date().toISOString() : undefined,
  };

  if (existingIdx >= 0) {
    item.assets[existingIdx] = asset;
  } else {
    item.assets.push(asset);
  }

  return NextResponse.json({ success: true, asset, media: item });
}
