import { NextResponse } from 'next/server';
import { recommend } from '@/app/lib/recommend';
import { PathChoice, RecommendRequest } from '@/app/lib/types';
import { isValidPath } from '@/app/lib/data';

function parseRequestBody(body: Partial<RecommendRequest>): RecommendRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const path = body.path;
  if (!path || typeof path !== 'string' || !isValidPath(path)) {
    throw new Error('Invalid path');
  }

  const country = typeof body.country === 'string' && body.country.trim().length > 0
    ? body.country.trim()
    : 'Unknown';

  const age = typeof body.age === 'number' && Number.isFinite(body.age) ? body.age : 0;

  const skills = Array.isArray(body.skills)
    ? body.skills.filter((skill): skill is string => typeof skill === 'string')
    : [];

  const language = typeof body.language === 'string' ? body.language : undefined;
  const equityFlag = typeof body.equityFlag === 'boolean' ? body.equityFlag : false;

  return {
    path: path as PathChoice,
    country,
    age,
    skills,
    language,
    equityFlag,
  };
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = parseRequestBody(json);
    const response = await recommend(payload);

    return NextResponse.json(response);
  } catch (error) {
    console.error('recommendation_error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to generate recommendations',
      },
      { status: 400 },
    );
  }
}

