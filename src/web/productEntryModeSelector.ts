export type ProductEntryMode = {
  id: 'head-to-head-cockpit' | 'simulation-lab';
  eyebrow: string;
  title: string;
  summary: string;
  href: '/head-to-head-lobby' | '/match-lab';
  cta: string;
  tone: 'primary' | 'secondary';
};

export type ProductEntryModeSelector = {
  hero: {
    eyebrow: string;
    title: string;
    summary: string;
  };
  modes: ProductEntryMode[];
};

export function createProductEntryModeSelector(): ProductEntryModeSelector {
  return {
    hero: {
      eyebrow: 'XCM0102 Online',
      title: 'XCM0102 Manager Console',
      summary: 'Choose the multiplayer manager cockpit or open the single-player simulation lab sandbox.'
    },
    modes: [
      {
        id: 'head-to-head-cockpit',
        eyebrow: 'Product loop',
        title: 'Head-to-head manager cockpit',
        summary: 'Create a lobby, join an opponent, privately save setup, lock, kick off, and review the result.',
        href: '/head-to-head-lobby',
        cta: 'Open manager cockpit',
        tone: 'primary'
      },
      {
        id: 'simulation-lab',
        eyebrow: 'Sandbox',
        title: 'Single-player simulation lab',
        summary: 'Use the older tactical sandbox for deterministic simulation, assignments, and replay experiments.',
        href: '/match-lab',
        cta: 'Open simulation lab',
        tone: 'secondary'
      }
    ]
  };
}
