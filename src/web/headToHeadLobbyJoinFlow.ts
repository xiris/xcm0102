import { getReplaySessionSummaryFromWeb, joinAwayManagerFromWeb, type WebReplaySessionJoinAwayRequest } from './replaySessionClient';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

export type JoinAwayManagerAndRefreshSummaryInput = {
  sessionId: string;
  awayManagerName: string;
  joinAwayManager?: (request: WebReplaySessionJoinAwayRequest) => Promise<unknown>;
  getSummary?: (sessionId: string) => Promise<ReplaySessionLobbySummary>;
};

export async function joinAwayManagerAndRefreshSummaryFromWeb({
  sessionId,
  awayManagerName,
  joinAwayManager = joinAwayManagerFromWeb,
  getSummary = getReplaySessionSummaryFromWeb
}: JoinAwayManagerAndRefreshSummaryInput): Promise<ReplaySessionLobbySummary> {
  const displayName = normalizeDisplayName(awayManagerName);
  await joinAwayManager({ sessionId, managerId: `away-${slugify(displayName)}`, displayName });
  return getSummary(sessionId);
}

function normalizeDisplayName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : 'Away Manager';
}

function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'manager';
}
