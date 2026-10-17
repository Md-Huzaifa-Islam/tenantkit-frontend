import { describe, expect, it } from 'vitest';
import { safeNext } from './navigation';

describe('safeNext', () => {
  it.each([
    ['/acme/projects', '/acme/projects'],
    ['//evil.com', null],
    ['https://evil.com', null],
    ['javascript:alert(1)', null],
    [null, null],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
