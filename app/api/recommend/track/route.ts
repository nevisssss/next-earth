import { NextResponse } from 'next/server';
import { getRecentRoleClicks, recordRoleClick } from '@/app/lib/analytics';
import { isValidPath } from '@/app/lib/data';
import { PathChoice } from '@/app/lib/types';

interface TrackRequestBody {
  roleId?: string;
  path?: string;
  country?: string;
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as TrackRequestBody;
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid request body');
    }

    const roleId = typeof json.roleId === 'string' ? json.roleId : null;
    const path = typeof json.path === 'string' && isValidPath(json.path) ? json.path as PathChoice : null;

    if (!roleId || !path) {
      throw new Error('roleId and path are required');
    }

    const country = typeof json.country === 'string' ? json.country : undefined;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const entry = recordRoleClick({ roleId, path, country, userAgent });

    return NextResponse.json({ ok: true, recordedAt: entry.timestamp });
  } catch (error) {
    console.error('role_click_track_error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to record click' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, events: getRecentRoleClicks() });
}

