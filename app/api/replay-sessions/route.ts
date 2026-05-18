import { NextResponse } from 'next/server';
import { createReplaySessionForApi } from '../../../src/api/replaySessionEndpoint';
import { replaySessionRepository } from './sessionStore';

export async function POST(request: Request) {
  const body = await request.json();
  const result = createReplaySessionForApi(body, replaySessionRepository);
  return NextResponse.json(result.body, { status: result.status });
}
