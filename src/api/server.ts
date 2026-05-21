import Fastify from 'fastify';
import { resumeMatchForApi } from './authoritativeResumeEndpoint';
import {
  appendReplaySessionCommandForApi,
  createReplaySessionForApi,
  getReplaySessionSummaryForApi,
  resumeReplaySessionForApi,
  syncReplaySessionVisibleEventsForApi
} from './replaySessionEndpoint';
import { createInMemoryReplaySessionRepository } from './replaySessionRepository';
import { simulateMatchForApi } from './simulationEndpoint';

export function buildServer() {
  const server = Fastify({ logger: false });
  const replaySessions = createInMemoryReplaySessionRepository();

  server.get('/health', async () => ({
    ok: true,
    service: 'xcm0102-api'
  }));

  server.post('/api/simulate-match', async (request, reply) => {
    const result = simulateMatchForApi(request.body);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  server.post('/api/resume-match', async (request, reply) => {
    const result = resumeMatchForApi(request.body);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  server.post('/api/replay-sessions', async (request, reply) => {
    const result = createReplaySessionForApi(request.body, replaySessions);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  server.post('/api/replay-sessions/:sessionId/commands', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const result = appendReplaySessionCommandForApi({ ...(request.body as Record<string, unknown>), sessionId }, replaySessions);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  server.get('/api/replay-sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const result = getReplaySessionSummaryForApi({ sessionId }, replaySessions);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  server.post('/api/replay-sessions/:sessionId/visible-events', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const result = syncReplaySessionVisibleEventsForApi({ ...(request.body as Record<string, unknown>), sessionId }, replaySessions);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  server.post('/api/replay-sessions/:sessionId/resume', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const result = resumeReplaySessionForApi({ ...(request.body as Record<string, unknown>), sessionId }, replaySessions);
    if (!result.ok) {
      return reply.status(result.status).send(result.body);
    }

    return result.body;
  });

  return server;
}
