import { getReplaySessionSummaryFromWeb, transitionReplaySessionLobbyStateFromWeb } from './replaySessionClient';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

type KickOffHeadToHeadMatchRequest = {
  sessionId: string;
  transition?: typeof transitionReplaySessionLobbyStateFromWeb;
  getSummary?: typeof getReplaySessionSummaryFromWeb;
};

export async function kickOffHeadToHeadMatchAndRefreshSummaryFromWeb({
  sessionId,
  transition = transitionReplaySessionLobbyStateFromWeb,
  getSummary = getReplaySessionSummaryFromWeb
}: KickOffHeadToHeadMatchRequest): Promise<ReplaySessionLobbySummary> {
  await transition({ sessionId, lobbyState: 'in_match' });
  return getSummary(sessionId);
}
