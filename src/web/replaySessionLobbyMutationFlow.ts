import { getReplaySessionSummaryFromWeb, transitionReplaySessionLobbyStateFromWeb } from './replaySessionClient';
import type { ReplaySessionLobbyAction, ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

type ApplyReplaySessionLobbyTransitionRequest = {
  sessionId: string;
  action: ReplaySessionLobbyAction;
  transition?: typeof transitionReplaySessionLobbyStateFromWeb;
  getSummary?: typeof getReplaySessionSummaryFromWeb;
};

export async function applyReplaySessionLobbyTransitionFromWeb({
  sessionId,
  action,
  transition = transitionReplaySessionLobbyStateFromWeb,
  getSummary = getReplaySessionSummaryFromWeb
}: ApplyReplaySessionLobbyTransitionRequest): Promise<ReplaySessionLobbySummary> {
  await transition({ sessionId, lobbyState: action.targetLobbyState });
  return getSummary(sessionId);
}
