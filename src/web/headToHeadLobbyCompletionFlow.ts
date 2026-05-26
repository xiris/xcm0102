import { getReplaySessionSummaryFromWeb, transitionReplaySessionLobbyStateFromWeb } from './replaySessionClient';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

type CompleteHeadToHeadMatchRequest = {
  sessionId: string;
  transition?: typeof transitionReplaySessionLobbyStateFromWeb;
  getSummary?: typeof getReplaySessionSummaryFromWeb;
};

export async function completeHeadToHeadMatchAndRefreshSummaryFromWeb({
  sessionId,
  transition = transitionReplaySessionLobbyStateFromWeb,
  getSummary = getReplaySessionSummaryFromWeb
}: CompleteHeadToHeadMatchRequest): Promise<ReplaySessionLobbySummary> {
  await transition({ sessionId, lobbyState: 'complete' });
  return getSummary(sessionId);
}
