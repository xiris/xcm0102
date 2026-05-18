import Fastify from 'fastify';
import { resumeMatchForApi } from './authoritativeResumeEndpoint';
import { simulateMatchForApi } from './simulationEndpoint';

export function buildServer() {
  const server = Fastify({ logger: false });

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

  return server;
}
