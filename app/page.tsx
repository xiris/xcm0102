import Link from 'next/link';
import { createProductEntryModeSelector } from '../src/web/productEntryModeSelector';

export default function HomePage() {
  const selector = createProductEntryModeSelector();

  return (
    <main className="shell product-entry-shell">
      <section className="hero product-entry-hero">
        <p className="eyebrow">{selector.hero.eyebrow}</p>
        <h1>{selector.hero.title}</h1>
        <p>{selector.hero.summary}</p>
      </section>

      <section className="product-mode-grid" aria-label="Product modes">
        {selector.modes.map((mode) => (
          <article className={`product-mode-card product-mode-card-${mode.tone}`} key={mode.id}>
            <p className="eyebrow">{mode.eyebrow}</p>
            <h2>{mode.title}</h2>
            <p>{mode.summary}</p>
            <Link href={mode.href}>{mode.cta}</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
