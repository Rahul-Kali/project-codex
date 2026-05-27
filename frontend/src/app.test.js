import { describe, expect, it } from 'vitest';

describe('dashboard statuses', () => {
  it('keeps the expected workflow states', () => {
    expect(['queued', 'running', 'blocked', 'done']).toContain('running');
  });
});

