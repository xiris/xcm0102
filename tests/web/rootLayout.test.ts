import { describe, expect, it } from 'vitest';
import RootLayout from '../../app/layout';

describe('RootLayout hydration contract', () => {
  it('suppresses browser-extension body attribute hydration noise', () => {
    const element = RootLayout({ children: 'content' });
    const bodyElement = element.props.children;

    expect(element.type).toBe('html');
    expect(bodyElement.type).toBe('body');
    expect(bodyElement.props.suppressHydrationWarning).toBe(true);
  });
});
