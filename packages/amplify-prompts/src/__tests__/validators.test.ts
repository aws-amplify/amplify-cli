import { alphanumeric } from '../validators';

describe('alphanumeric', () => {
  it('returns true for alphanumeric strings', () => {
    expect(alphanumeric('thisisatest')).toBe(true);
  });
});
