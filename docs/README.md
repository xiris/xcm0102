# XCM0102 Documentation

Research and design documentation for building a modern online football-management game inspired by Championship Manager 01/02 (CM0102), preserving the fun while fixing dated gaps.

Documentation map:

- 00-research-sources.md — source inventory and reliability notes.
- 01-product-principles.md — what made CM0102 fun, what to preserve, what to modernize.
- 02-game-systems.md — core loop, manager/club, players, tactics, training, scouting, transfers, news.
- 03-domain-model.md — entities, state boundaries, history/event records.
- 04-online-modernization.md — multiplayer, async progression, fairness, UX, modding.
- 05-roadmap.md — MVP and phased implementation plan.
- 06-head-to-head-tournaments.md — first-class 1v1 versus mode and tournament design.
- 07-match-engine-variables.md — intrinsic attributes, context variables, WIB/WOB flaws, and match-engine architecture.
- 08-technology-stack.md — recommended product stack and prototype/deployment architecture.
- 09-spike-findings.md — validated spike findings, decisions, test conventions, and recommended next spike.
- 10-production-roadmap.md — production sequence after validated spikes.
- 11-production-simulation-contract.md — first production TypeScript match-engine contract.
- 12-production-api-contract.md — first Fastify API boundary around the simulation package.
- 13-production-web-contract.md — first browser-visible Next.js match lab vertical slice.
- 14-production-tactics-contract.md — first browser/API tactical editor contract.
- 15-production-formation-geometry-contract.md — formation slot geometry and shape-driven WIB/WOB map contract.
- 16-production-player-assignment-contract.md — slot assignment and role-suitability simulation contract.
- 17-production-interactive-assignment-contract.md — browser slot dropdown assignment and API validation contract.
- 18-production-visual-pitch-assignment-contract.md — visual pitch, drag/drop, and Inter/Milan 2002 sample squad assignment contract.
- 19-production-historic-player-data-contract.md — shared Inter/Milan 2002 player names, positions, and era-inspired attributes contract.
- 20-production-chance-quality-commentary-contract.md — deterministic per-chance goal resolution and varied match text contract.
- 21-production-event-taxonomy-commentary-packs.md — structured event categories and CM-style commentary pack contract.
- 22-production-match-event-chains-contract.md — foul/free-kick/corner/offside/card chain contract and interactive-match roadmap.
- 23-production-hydration-warning-noise-contract.md — root body hydration warning suppression for extension-injected attributes.
- 24-production-bench-substitution-condition-contract.md — historic benches, fatigue/injury risk, and substitution event contract.
- 25-production-interactive-match-timeline-contract.md — progressive key-event match replay and manager-action pause contract.
- 26-production-manager-commands-contract.md — interactive replay manager command-history recording contract.
- 27-production-command-effects-contract.md — deterministic projected effects for manager commands during interactive replay.
- 28-stabilization-fixes-pass-notes.md — post-P15A duplicate-command and replay-navigation cleanup notes.
- 29-production-resumable-replay-projection-contract.md — deterministic projected remaining replay after manager commands.
- 30-project-handoff-status.md — current repository state, latest validation, next recommended slice, and new-chat resume instructions.
- 31-production-authoritative-resumable-match-engine-contract.md — pure authoritative resume module for command-adjusted future simulation.
- 32-production-authoritative-resume-api-contract.md — API/view-model adapter for authoritative resume commands.
- 33-match-lab-ui-modernization-contract.md — tested Match Lab section/stat grouping and first UI modernization direction.
- 34-authoritative-resume-ui-contract.md — browser client and Match Lab UI contract for server-authoritative resume output.
- 35-production-replay-session-persistence-contract.md — in-memory replay-session persistence seam for stored authoritative resume state.
- 36-browser-replay-session-ui-contract.md — Match Lab browser integration contract for session-owned authoritative resume.
- 37-production-replay-session-tactic-parity-contract.md — replay-session contract for preserving full Match Lab tactical payloads.
- 38-production-durable-replay-session-persistence-contract.md — storage-shaped replay-session export/hydration contract for future durable persistence.
- 39-production-head-to-head-session-ownership-contract.md — replay-session side ownership and head-to-head command-log contract.
- 40-production-session-route-parity-lobby-state-contract.md — route-boundary parity and lobby-state summary contract for replay sessions.
- 41-production-lobby-state-transition-contract.md — server-owned replay-session lobby-state transition command contract.
- 42-production-lobby-status-panel-contract.md — read-only Match Lab replay-session lobby/status panel contract.
- 43-production-side-aware-lobby-readiness-contract.md — read-only home/away lobby readiness cards contract.
- plans/2026-05-16-production-simulation-foundation.md — implementation plan for the first TypeScript production simulation package.
- plans/2026-05-16-production-api-foundation.md — implementation plan for the first server-authoritative API layer.
- plans/2026-05-16-production-web-vertical-slice.md — implementation plan for the first browser-visible match lab.
- plans/2026-05-16-tactical-editor-foundation.md — implementation plan for the first tactical editor foundation.
- plans/2026-05-17-formation-geometry-foundation.md — implementation plan for formation slot geometry and preview foundation.
- plans/2026-05-17-player-assignment-role-suitability.md — implementation plan for player assignment and role suitability.
- plans/2026-05-17-interactive-assignment-ui.md — implementation plan for browser slot dropdown assignments.
- plans/2026-05-17-visual-pitch-drag-drop-assignment.md — implementation plan for visual pitch drag/drop assignment.
- plans/2026-05-17-historic-player-data-foundation.md — implementation plan for shared historic player data foundation.
- plans/2026-05-17-chance-quality-commentary-engine.md — implementation plan for per-chance goal resolution and varied commentary.
- plans/2026-05-17-event-taxonomy-commentary-packs.md — implementation plan for structured event categories and expanded commentary packs.
- plans/2026-05-17-match-event-chains.md — implementation plan for foul/free-kick/corner/offside/card chains and interactive-match roadmap.
- plans/2026-05-17-bench-substitutions-fatigue-injuries.md — implementation plan for historic benches and condition/substitution events.
- plans/2026-05-17-interactive-match-timeline.md — implementation plan for progressive key-event replay and manager action pause labels.
- plans/2026-05-17-manager-commands-interactive-replay.md — implementation plan for recording manager commands during interactive replay.
- plans/2026-05-17-outcome-affecting-manager-commands.md — implementation plan for projected tactical effects from manager commands.
- plans/2026-05-17-stabilization-fixes-pass.md — stabilization plan for duplicate-command and replay-navigation cleanup.
- plans/2026-05-17-resumable-match-regeneration.md — implementation plan for projected remaining replay after manager commands.
- plans/2026-05-18-authoritative-resumable-match-engine.md — implementation plan for the first pure authoritative resumable match engine foundation.
- plans/2026-05-18-authoritative-resume-api-adapter.md — implementation plan for authoritative resume command/API/view-model adapter.
- plans/2026-05-18-match-lab-ui-modernization.md — implementation plan for Match Lab UI modernization foundation.
- plans/2026-05-18-authoritative-resume-ui-integration.md — implementation plan for Match Lab server-authoritative resume UI integration.
- plans/2026-05-18-replay-session-persistence-foundation.md — implementation plan for stored replay-session persistence foundation.
- plans/2026-05-18-browser-replay-session-ui-integration.md — implementation plan for Match Lab replay-session ID and session-owned resume integration.
- plans/2026-05-18-replay-session-tactic-parity.md — implementation plan for replay-session full tactical payload parity.
- plans/2026-05-19-durable-replay-session-persistence.md — implementation plan for storage-shaped replay-session export/hydration.
- plans/2026-05-19-head-to-head-session-ownership.md — implementation plan for replay-session side ownership and future head-to-head lobbies.
- plans/2026-05-20-session-route-parity-lobby-state.md — implementation plan for side-aware route parity and session summary smoke coverage.
- plans/2026-05-21-lobby-state-transition-commands.md — implementation plan for server-owned replay-session lobby-state transition commands.
- plans/2026-05-21-lobby-setup-status-panel.md — implementation plan for the read-only lobby setup/status panel.

Raw downloaded/extracted research material is in docs/research_raw/.

Legal note: these docs are for research and design. Do not copy Championship Manager assets, executable data, logo, database, names, or manual text into a commercial product unless licensed. Treat CM0102 as design inspiration and implement original code, UI, data, and content.
