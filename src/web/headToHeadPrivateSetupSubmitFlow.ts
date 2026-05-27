import type { MatchSide } from '../api/replaySessionRepository';
import { getReplaySessionSummaryFromWeb, submitReplaySessionPrivateSetupDraftFromWeb } from './replaySessionClient';
import type { HeadToHeadPrivateSetupDraft } from './headToHeadPrivateSetupSelectionState';
import type { ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

type SubmitHeadToHeadPrivateSetupDraftRequest = {
  sessionId: string;
  side: MatchSide;
  draft: HeadToHeadPrivateSetupDraft;
  submit?: typeof submitReplaySessionPrivateSetupDraftFromWeb;
  getSummary?: typeof getReplaySessionSummaryFromWeb;
};

export async function submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb({
  sessionId,
  side,
  draft,
  submit = submitReplaySessionPrivateSetupDraftFromWeb,
  getSummary = getReplaySessionSummaryFromWeb
}: SubmitHeadToHeadPrivateSetupDraftRequest): Promise<ReplaySessionLobbySummary> {
  const { clubId, tacticShellId, readinessIntent } = draft;
  await submit({ sessionId, side, draft: { clubId, tacticShellId, readinessIntent } });
  return getSummary(sessionId);
}
