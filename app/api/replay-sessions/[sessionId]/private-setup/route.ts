import { NextResponse } from 'next/server';
import { storeReplaySessionPrivateSetupDraftForApi } from '../../../../../src/api/replaySessionEndpoint';
import { replaySessionRepository } from '../../sessionStore';

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const body = await request.json();
  const { sessionId } = await context.params;
  const result = storeReplaySessionPrivateSetupDraftForApi({ ...body, sessionId }, replaySessionRepository);
  return NextResponse.json(result.body, { status: result.status });
}
