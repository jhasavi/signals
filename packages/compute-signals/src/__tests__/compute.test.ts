import { it, expect } from 'vitest';

// A tiny smoke test to ensure compute runner module imports correctly
it('compute runner module loads', async () => {
  const mod = await import('../compute');
  expect(typeof mod).toBe('object');
});
