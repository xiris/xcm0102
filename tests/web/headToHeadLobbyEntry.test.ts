import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeadToHeadLobbyEntry } from '../../src/web/HeadToHeadLobbyEntry';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

describe('HeadToHeadLobbyEntry', () => {
  it('renders product-facing lobby creation, join, lock, and kickoff controls without completion controls', () => {
    const markup = renderToStaticMarkup(createElement(HeadToHeadLobbyEntry));

    expect(markup).toContain('Manager cockpit');
    expect(markup).toContain('Lobby desk');
    expect(markup).toContain('Match controls');
    expect(markup).toContain('Home manager name');
    expect(markup).toContain('Create lobby');
    expect(markup).toContain('Existing lobby session ID');
    expect(markup).toContain('View lobby');
    expect(markup).toContain('Away manager name');
    expect(markup).toContain('Join as away manager');
    expect(markup).toContain('Lock setup');
    expect(markup).toContain('Kick off match');
    expect(markup).not.toContain('Complete match');
  });

  it('keeps the product entry route on product-specific lobby flows by avoiding generic transition helpers', () => {
    const pageSource = readProjectFile('app/head-to-head-lobby/page.tsx');
    const componentSource = readProjectFile('src/web/HeadToHeadLobbyEntry.tsx');
    const shellSource = readProjectFile('src/web/headToHeadPrivateSetupShell.ts');
    const selectionSource = readProjectFile('src/web/headToHeadPrivateSetupSelectionState.ts');
    const perspectiveSource = readProjectFile('src/web/headToHeadPrivateSetupPerspectiveSwitch.ts');
    const readinessBoundarySource = readProjectFile('src/web/headToHeadPrivateSetupReadinessBoundary.ts');
    const cockpitLayoutSource = readProjectFile('src/web/headToHeadManagerCockpitLayout.ts');

    expect(pageSource).toContain('HeadToHeadLobbyEntry');
    expect(componentSource).toContain('createHeadToHeadLobbyRequest');
    expect(componentSource).toContain('createHeadToHeadLobbyReadModel');
    expect(componentSource).toContain('createHeadToHeadLobbyActionCopy');
    expect(componentSource).toContain('createHeadToHeadManagerCockpitLayout');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupShell');
    expect(componentSource).toContain('privateSetupShell');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupDraftControls');
    expect(componentSource).toContain('applyHeadToHeadPrivateSetupDraftControlChange');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupPerspectiveSwitch');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupReadinessBoundary');
    expect(componentSource).toContain('submitHeadToHeadPrivateSetupDraftAndRefreshSummaryFromWeb');
    expect(componentSource).toContain("useState<MatchSide>('home')");
    expect(componentSource).toContain('Manager cockpit');
    expect(componentSource).toContain('cockpit-layout');
    expect(componentSource).toContain('cockpit-rail');
    expect(componentSource).toContain('cockpit-workspace');
    expect(componentSource).toContain('Session rail');
    expect(componentSource).toContain('Station workspace');
    expect(componentSource).toContain('cockpit-tabs');
    expect(cockpitLayoutSource).toContain('Lobby desk');
    expect(cockpitLayoutSource).toContain('Team setup');
    expect(cockpitLayoutSource).toContain('Match controls');
    expect(cockpitLayoutSource).toContain('Report room');
    expect(componentSource).toContain('Server setup draft');
    expect(perspectiveSource).toContain('Local private setup perspective');
    expect(perspectiveSource).toContain('Perspective only changes this browser preview');
    expect(componentSource).toContain('privateSetupDrafts');
    expect(componentSource).toContain('localSetupSide');
    expect(componentSource).toContain('onChange={(event) => updatePrivateSetupDraft');
    expect(componentSource).toContain('onChange={(event) => setLocalSetupSide');
    expect(componentSource).toContain('lockAvailable: actionCopy.lockSetup.enabled');
    expect(componentSource).toContain('privateSetupReadinessBoundary.title');
    expect(readinessBoundarySource).toContain('Setup readiness boundary');
    expect(readinessBoundarySource).toContain('Readiness intent is saved with the private draft but never gates server-owned setup lock');
    expect(readinessBoundarySource).toContain('Private setup readiness can be submitted as a hidden side-scoped server draft');
    expect(componentSource).toContain('Saved setup draft to the server for');
    expect(componentSource).toContain('onClick={submitPrivateSetupDraft}');
    expect(componentSource).toContain('privateSetupDraftControls.enabled');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupDraftControls({ summary, localSide: localSetupSide');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupShell(summary, { localSide: localSetupSide');
    expect(componentSource).toContain('Private setup preview');
    expect(componentSource).toContain('Selection status');
    expect(componentSource).toContain('Tactic shell');
    expect(shellSource).toContain('createHeadToHeadPrivateSetupSelectionState');
    expect(shellSource).toContain('selectionStatusLabel');
    expect(selectionSource).toContain('Hidden until lock');
    expect(shellSource).toContain('Milan 2002');
    expect(shellSource).toContain('No hidden choices are stored yet');
    expect(componentSource).toContain('actionCopy.joinAway.enabled');
    expect(componentSource).toContain('actionCopy.lockSetup.enabled');
    expect(componentSource).toContain('actionCopy.kickOff.enabled');
    expect(componentSource).toContain('actionCopy.completeMatch.enabled');
    expect(componentSource).toContain('createReplaySessionFromWeb');
    expect(componentSource).toContain('getReplaySessionSummaryFromWeb');
    expect(componentSource).toContain('joinAwayManagerAndRefreshSummaryFromWeb');
    expect(componentSource).toContain('lockHeadToHeadSetupAndRefreshSummaryFromWeb');
    expect(componentSource).toContain('kickOffHeadToHeadMatchAndRefreshSummaryFromWeb');
    expect(componentSource).toContain('completeHeadToHeadMatchAndRefreshSummaryFromWeb');
    expect(componentSource).toContain('createHeadToHeadResultReportPreview');
    expect(componentSource).toContain('Post-match report preview');
    expect(componentSource).not.toContain('storeReplaySessionPrivateSetupDraft');
    expect(componentSource).not.toContain('localStorage');
    expect(componentSource).not.toContain('sessionStorage');
    expect(componentSource).not.toContain('Rematch');
    expect(componentSource).not.toContain('LobbyMutationControls');
    expect(componentSource).not.toContain('applyReplaySessionLobbyTransitionFromWeb');
  });
});
