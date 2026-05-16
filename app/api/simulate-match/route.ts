import { NextResponse } from 'next/server';
import { simulateMatchForApi } from '../../../src/api/simulationEndpoint';

export async function POST(request: Request) {
  const body = await request.json();
  const result = simulateMatchForApi(body);
  return NextResponse.json(result.body, { status: result.status });
}
