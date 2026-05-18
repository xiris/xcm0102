import type { MatchEvent, MatchResult } from '../simulation/domain';
import type { ManagerCommand } from '../simulation/managerCommands';

export type ReplaySessionAuditType =
  | 'session_created'
  | 'manager_command_appended'
  | 'visible_events_replaced'
  | 'authoritative_resume_recorded';

export type ReplaySessionAuditEntry = {
  type: ReplaySessionAuditType;
  timestamp: string;
  currentMinute?: number;
  eventCount?: number;
  signature?: string;
  commandId?: string;
};

export type ReplaySession = {
  sessionId: string;
  seed: number;
  initialResult: MatchResult;
  visibleEvents: MatchEvent[];
  managerCommands: ManagerCommand[];
  latestAuthoritativeSignature?: string;
  auditLog: ReplaySessionAuditEntry[];
  createdAt: string;
  updatedAt: string;
};

export type CreateReplaySessionInput = {
  seed: number;
  initialResult: MatchResult;
  visibleEvents?: MatchEvent[];
};

export type AuthoritativeResumeAuditInput = {
  signature: string;
  currentMinute: number;
  eventCount: number;
};

export type ReplaySessionRepository = {
  createSession(input: CreateReplaySessionInput): ReplaySession;
  getSession(sessionId: string): ReplaySession;
  appendManagerCommand(sessionId: string, command: ManagerCommand): ReplaySession;
  replaceVisibleEvents(sessionId: string, visibleEvents: MatchEvent[]): ReplaySession;
  recordAuthoritativeResume(sessionId: string, input: AuthoritativeResumeAuditInput): ReplaySession;
};

export function createInMemoryReplaySessionRepository(): ReplaySessionRepository {
  const sessions = new Map<string, ReplaySession>();
  let nextId = 1;

  function requireSession(sessionId: string): ReplaySession {
    const session = sessions.get(sessionId);
    if (!session) throw new Error(`Replay session not found: ${sessionId}`);
    return session;
  }

  function save(session: ReplaySession): ReplaySession {
    sessions.set(session.sessionId, session);
    return session;
  }

  function now(): string {
    return new Date().toISOString();
  }

  return {
    createSession(input) {
      const timestamp = now();
      const sessionId = `rs-${String(nextId).padStart(6, '0')}`;
      nextId += 1;
      return save({
        sessionId,
        seed: input.seed,
        initialResult: input.initialResult,
        visibleEvents: input.visibleEvents ?? [],
        managerCommands: [],
        auditLog: [{ type: 'session_created', timestamp, eventCount: input.visibleEvents?.length ?? 0 }],
        createdAt: timestamp,
        updatedAt: timestamp
      });
    },
    getSession(sessionId) {
      return requireSession(sessionId);
    },
    appendManagerCommand(sessionId, command) {
      const session = requireSession(sessionId);
      return save({
        ...session,
        managerCommands: [...session.managerCommands, command],
        auditLog: [...session.auditLog, { type: 'manager_command_appended', timestamp: now(), currentMinute: command.minute, commandId: command.id }],
        updatedAt: now()
      });
    },
    replaceVisibleEvents(sessionId, visibleEvents) {
      const session = requireSession(sessionId);
      return save({
        ...session,
        visibleEvents,
        auditLog: [...session.auditLog, { type: 'visible_events_replaced', timestamp: now(), eventCount: visibleEvents.length }],
        updatedAt: now()
      });
    },
    recordAuthoritativeResume(sessionId, input) {
      const session = requireSession(sessionId);
      return save({
        ...session,
        latestAuthoritativeSignature: input.signature,
        auditLog: [
          ...session.auditLog,
          {
            type: 'authoritative_resume_recorded',
            timestamp: now(),
            currentMinute: input.currentMinute,
            eventCount: input.eventCount,
            signature: input.signature
          }
        ],
        updatedAt: now()
      });
    }
  };
}
