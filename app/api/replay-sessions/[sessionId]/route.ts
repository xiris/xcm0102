import { NextResponse } from 'next/server';
import { getReplaySessionSummaryForApi } from '../../../../src/api/replaySessionEndpoint';
import { replaySessionRepository } from '../sessionStore';

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const result = getReplaySessionSummaryForApi({ sessionId }, replaySessionRepository);
  return NextResponse.json(result.body, { status: result.status });
}
