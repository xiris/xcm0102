import type { ReplaySessionLobbyAction, ReplaySessionLobbyStatusViewModel } from './replaySessionLobbyStatusViewModel';

type LobbyMutationControlsProps = {
  status: ReplaySessionLobbyStatusViewModel;
  isPending?: boolean;
  error?: string | null;
  onTransition: (action: ReplaySessionLobbyAction) => void;
};

export function LobbyMutationControls({ status, isPending = false, error = null, onTransition }: LobbyMutationControlsProps) {
  const availability = status.actionAvailability;

  return (
    <section className="lobby-mutation-controls" aria-label="Lobby transition controls">
      <h4>Lobby transition controls</h4>
      <p>{availability.helperText}</p>
      {error ? <p className="error">{error}</p> : null}
      {availability.actions.length === 0 ? (
        <p>No lobby transition controls are available.</p>
      ) : (
        <ul>
          {availability.actions.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                disabled={isPending || !action.available}
                onClick={() => onTransition(action)}
              >
                {isPending ? 'Updating lobby...' : action.label}
              </button>
              <span>Target: {action.targetLobbyState}</span>
              {action.disabledReason ? <small>{action.disabledReason}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
