import { describe, expect, it } from 'vitest';
import RootLayout, { metadata } from '../../app/layout';

describe('RootLayout hydration contract', () => {
  it('suppresses browser-extension body attribute hydration noise', () => {
    const element = RootLayout({ children: 'content' });
    const bodyElement = element.props.children;

    expect(element.type).toBe('html');
    expect(bodyElement.type).toBe('body');
    expect(bodyElement.props.suppressHydrationWarning).toBe(true);
  });

  it('uses manager-console metadata for the product entry shell', () => {
    expect(metadata.title).toBe('XCM0102 Manager Console');
    expect(metadata.description).toBe('A modern online football manager console with head-to-head cockpit and simulation lab modes.');
  });
});
