import type { MatchEvent, MatchInput, MatchResult } from '../simulation/domain';
import type { ManagerCommand } from '../simulation/managerCommands';

export type MatchSide = 'home' | 'away';

export type ReplaySessionLobbyState = 'setup' | 'locked' | 'in_match' | 'complete';

export type ReplaySessionSideOwner = {
  managerId: string;
  displayName: string;
};

export type ReplaySessionOwnership = {
  mode: 'single_manager' | 'head_to_head';
  lobbyState: ReplaySessionLobbyState;
  sides: {
    home?: ReplaySessionSideOwner;
    away?: ReplaySessionSideOwner;
  };
};

export type ReplaySessionSideCommandLogs = Record<MatchSide, ManagerCommand[]>;

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
  commandSide?: MatchSide;
};

export type ReplaySession = {
  sessionId: string;
  seed: number;
  baseInput: MatchInput;
  initialResult: MatchResult;
  visibleEvents: MatchEvent[];
  managerCommands: ManagerCommand[];
  sideManagerCommands: ReplaySessionSideCommandLogs;
  ownership: ReplaySessionOwnership;
  latestAuthoritativeSignature?: string;
  auditLog: ReplaySessionAuditEntry[];
  createdAt: string;
  updatedAt: string;
};

export type ReplaySessionStorageRecord = ReplaySession & {
  schemaVersion: 1;
};

export type CreateReplaySessionInput = {
  seed: number;
  baseInput: MatchInput;
  initialResult: MatchResult;
  visibleEvents?: MatchEvent[];
  ownership?: ReplaySessionOwnership;
};

export type AuthoritativeResumeAuditInput = {
  signature: string;
  currentMinute: number;
  eventCount: number;
};

export type ReplaySessionRepository = {
  createSession(input: CreateReplaySessionInput): ReplaySession;
  getSession(sessionId: string): ReplaySession;
  appendManagerCommand(sessionId: string, command: ManagerCommand, side?: MatchSide): ReplaySession;
  replaceVisibleEvents(sessionId: string, visibleEvents: MatchEvent[]): ReplaySession;
  recordAuthoritativeResume(sessionId: string, input: AuthoritativeResumeAuditInput): ReplaySession;
  listStorageRecords(): ReplaySessionStorageRecord[];
  hydrateStorageRecords(records: ReplaySessionStorageRecord[]): void;
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

  function clone<T>(value: T): T {
    return structuredClone(value);
  }

  function defaultOwnership(): ReplaySessionOwnership {
    return {
      mode: 'single_manager',
      lobbyState: 'in_match',
      sides: { home: { managerId: 'local-home', displayName: 'Local manager' } }
    };
  }

  function emptySideCommands(): ReplaySessionSideCommandLogs {
    return { home: [], away: [] };
  }

  function commandCounts(session: ReplaySession): Record<MatchSide, number> {
    return { home: session.sideManagerCommands.home.length, away: session.sideManagerCommands.away.length };
  }

  function sessionToRecord(session: ReplaySession): ReplaySessionStorageRecord {
    return { schemaVersion: 1, ...clone(session) };
  }

  function recordToSession(record: ReplaySessionStorageRecord): ReplaySession {
    if (record.schemaVersion !== 1) {
      throw new Error(`Unsupported replay session storage schema version: ${String(record.schemaVersion)}`);
    }
    const { schemaVersion: _schemaVersion, ...session } = clone(record);
    return session;
  }

  function nextIdAfterRecords(records: ReplaySessionStorageRecord[]): number {
    return records.reduce((highest, record) => {
      const match = /^rs-(\d+)$/.exec(record.sessionId);
      if (!match) return highest;
      const numericId = match[1];
      if (!numericId) return highest;
      return Math.max(highest, Number.parseInt(numericId, 10));
    }, 0) + 1;
  }

  return {
    createSession(input) {
      const timestamp = now();
      const sessionId = `rs-${String(nextId).padStart(6, '0')}`;
      nextId += 1;
      return save({
        sessionId,
        seed: input.seed,
        baseInput: input.baseInput,
        initialResult: input.initialResult,
        visibleEvents: input.visibleEvents ?? [],
        managerCommands: [],
        sideManagerCommands: emptySideCommands(),
        ownership: input.ownership ?? defaultOwnership(),
        auditLog: [{ type: 'session_created', timestamp, eventCount: input.visibleEvents?.length ?? 0 }],
        createdAt: timestamp,
        updatedAt: timestamp
      });
    },
    getSession(sessionId) {
      return requireSession(sessionId);
    },
    appendManagerCommand(sessionId, command, side = 'home') {
      const session = requireSession(sessionId);
      const sideManagerCommands = {
        ...session.sideManagerCommands,
        [side]: [...session.sideManagerCommands[side], command]
      };
      return save({
        ...session,
        managerCommands: sideManagerCommands.home,
        sideManagerCommands,
        auditLog: [...session.auditLog, { type: 'manager_command_appended', timestamp: now(), currentMinute: command.minute, commandId: command.id, commandSide: side }],
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
    },
    listStorageRecords() {
      return [...sessions.values()].map(sessionToRecord);
    },
    hydrateStorageRecords(records) {
      const nextSessions = new Map<string, ReplaySession>();
      for (const record of records) {
        const session = recordToSession(record);
        nextSessions.set(session.sessionId, session);
      }
      sessions.clear();
      for (const [sessionId, session] of nextSessions.entries()) {
        sessions.set(sessionId, session);
      }
      nextId = nextIdAfterRecords(records);
    }
  };
}
