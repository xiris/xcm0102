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

    expect(markup).toContain('Head-to-head lobby');
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

    expect(pageSource).toContain('HeadToHeadLobbyEntry');
    expect(componentSource).toContain('createHeadToHeadLobbyRequest');
    expect(componentSource).toContain('createHeadToHeadLobbyReadModel');
    expect(componentSource).toContain('createHeadToHeadLobbyActionCopy');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupShell');
    expect(componentSource).toContain('privateSetupShell');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupDraftControls');
    expect(componentSource).toContain('applyHeadToHeadPrivateSetupDraftControlChange');
    expect(componentSource).toContain('Local browser draft only');
    expect(componentSource).toContain('privateSetupDrafts');
    expect(componentSource).toContain('onChange={(event) => updatePrivateSetupDraft');
    expect(componentSource).toContain('createHeadToHeadPrivateSetupShell(summary,');
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
    expect(componentSource).not.toContain('Submit setup');
    expect(componentSource).not.toContain('Save setup');
    expect(componentSource).not.toContain('localStorage');
    expect(componentSource).not.toContain('sessionStorage');
    expect(componentSource).not.toContain('Rematch');
    expect(componentSource).not.toContain('LobbyMutationControls');
    expect(componentSource).not.toContain('applyReplaySessionLobbyTransitionFromWeb');
  });
});
