import { getReplaySessionSummaryFromWeb, transitionReplaySessionLobbyStateFromWeb } from './replaySessionClient';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

type LockHeadToHeadSetupRequest = {
  sessionId: string;
  transition?: typeof transitionReplaySessionLobbyStateFromWeb;
  getSummary?: typeof getReplaySessionSummaryFromWeb;
};

export async function lockHeadToHeadSetupAndRefreshSummaryFromWeb({
  sessionId,
  transition = transitionReplaySessionLobbyStateFromWeb,
  getSummary = getReplaySessionSummaryFromWeb
}: LockHeadToHeadSetupRequest): Promise<ReplaySessionLobbySummary> {
  await transition({ sessionId, lobbyState: 'locked' });
  return getSummary(sessionId);
}
