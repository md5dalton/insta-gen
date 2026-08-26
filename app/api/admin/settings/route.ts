import { NextResponse } from 'next/server';
import { db } from '../../../src/server/db';
import { authenticateRequest } from '../../../src/server/auth';
import { enrichMediaItem } from '../../../src/server/policy';

export async function GET(request: Request) {
  const admin = authenticateRequest(request.headers.get('authorization') || undefined);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(db.settings);
}

