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
- plans/2026-05-16-production-simulation-foundation.md — implementation plan for the first TypeScript production simulation package.
- plans/2026-05-16-production-api-foundation.md — implementation plan for the first server-authoritative API layer.

Raw downloaded/extracted research material is in docs/research_raw/.

Legal note: these docs are for research and design. Do not copy Championship Manager assets, executable data, logo, database, names, or manual text into a commercial product unless licensed. Treat CM0102 as design inspiration and implement original code, UI, data, and content.
