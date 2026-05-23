import { LobbyStatusCard } from './MatchLab';
import { createReplaySessionLobbyRouteFixtures, type ReplaySessionLobbyRouteFixtures } from './replaySessionLobbyRouteFixtures';
import { createReplaySessionLobbyStatusViewModel, type ReplaySessionLobbySummary } from './replaySessionLobbyStatusViewModel';

type LobbyFixtureGalleryItem = {
  id: keyof ReplaySessionLobbyRouteFixtures;
  title: string;
  summary: ReplaySessionLobbySummary;
};

export function LobbyFixtureGallery() {
  const fixtures = createReplaySessionLobbyRouteFixtures();
  const items: LobbyFixtureGalleryItem[] = [
    { id: 'setup', title: 'Setup preview fixture', summary: fixtures.setup },
    { id: 'locked', title: 'Locked preview fixture', summary: fixtures.locked },
    { id: 'inMatch', title: 'In-match preview fixture', summary: fixtures.inMatch },
    { id: 'complete', title: 'Complete preview fixture', summary: fixtures.complete }
  ];

  return (
    <main className="shell lobby-fixture-gallery">
      <section className="hero">
        <p>Read-only route fixture gallery</p>
        <h1>Lobby fixture gallery</h1>
        <p>This gallery renders route-shaped lobby summaries without calling transition helpers or exposing mutation controls.</p>
      </section>

      <section className="panel-grid" aria-label="Read-only lobby action preview fixtures">
        {items.map((item) => (
          <article className="fixture-card" key={item.id}>
            <p className="eyebrow">{item.title}</p>
            <LobbyStatusCard status={createReplaySessionLobbyStatusViewModel(item.summary)} />
          </article>
        ))}
      </section>
    </main>
  );
}
