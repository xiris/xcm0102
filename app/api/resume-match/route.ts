import { NextResponse } from 'next/server';
import { resumeMatchForApi } from '../../../src/api/authoritativeResumeEndpoint';

export async function POST(request: Request) {
  const body = await request.json();
  const result = resumeMatchForApi(body);
  return NextResponse.json(result.body, { status: result.status });
}
