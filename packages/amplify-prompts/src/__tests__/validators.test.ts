import { alphanumeric, and, integer, maxLength, minLength, not, or } from '../validators';

describe('alphanumeric', () => {
  it('returns true for alphanumeric strings', () => {
    expect(alphanumeric()('thisisatest')).toBe(true);
  });

  it('returns default error message for non-alphanumeric strings', () => {
    expect(alphanumeric()('!@#$')).toMatchInlineSnapshot(`"Input must be alphanumeric"`);
  });

  it('returns specified error message for non-alphanumeric string', () => {
    expect(alphanumeric('this is the error message')('!@#$')).toMatchInlineSnapshot(`"this is the error message"`);
  });
});

describe('integer', () => {
  it('returns true for integers', () => {
    expect(integer()('10')).toBe(true);
  });

  it('returns default error message for non-integers', () => {
    expect(integer()('non an integer')).toMatchInlineSnapshot(`"Input must be a number"`);
  });

  it('returns specified error message for non-integers', () => {
    expect(integer('custom error message')('not an integer')).toMatchInlineSnapshot(`"custom error message"`);
  });
});

describe('maxLength', () => {
  it('returns true for input of max length', () => {
    expect(maxLength(3)('abc')).toBe(true);
  });

  it('returns true for input of max length - 1', () => {
    expect(maxLength(3)('ab')).toBe(true);
  });

  it('returns default error message for input of max length + 1', () => {
    expect(maxLength(3)('abcd')).toMatchInlineSnapshot(`"Input must be less than 3 characters long"`);
  });

  it('returns specified error message for input of max length + 1', () => {
    expect(maxLength(3, 'custom error message')('abcd')).toMatchInlineSnapshot(`"custom error message"`);
  });
});

describe('minLength', () => {
  it('returns true for input of min length', () => {
    expect(minLength(3)('abc')).toBe(true);
  });

  it('returns true for input of mmin length + 1', () => {
    expect(minLength(3)('abcd')).toBe(true);
  });

  it('returns default error message for input of min length - 1', () => {
    expect(minLength(3)('ab')).toMatchInlineSnapshot(`"Input must be more than 3 characters long"`);
  });

  it('returns specified error message for input of min length - 1', () => {
    expect(minLength(3, 'custom error message')('ab')).toMatchInlineSnapshot(`"custom error message"`);
  });
});

describe('and', () => {
  it('returns true if all validators return true', async () => {
    expect(await and([input => true, input => true])('anything')).toBe(true);
  });

  it('returns first error message', async () => {
    expect(await and([input => true, input => 'first error', input => 'second error'])('anything')).toMatchInlineSnapshot(`"first error"`);
  });

  it('returns override message if any validators return error message', async () => {
    expect(
      await and([input => true, input => 'first error', input => 'second error'], 'custom error message')('anything'),
    ).toMatchInlineSnapshot(`"custom error message"`);
  });
});

describe('or', () => {
  it('returns true if one validator returns true', async () => {
    expect(await or([input => 'first error', input => true])('anything')).toBe(true);
  });

  it('returns last error message if all validators return error', async () => {
    expect(await or([input => 'first error', input => 'second error'])('anything')).toMatchInlineSnapshot(`"second error"`);
  });

  it('returns override error mmessage if all validators return error', async () => {
    expect(await or([input => 'first error', input => 'second error'], 'custom message')('anything')).toMatchInlineSnapshot(
      `"custom message"`,
    );
  });
});

describe('not', () => {
  it('returns error message if validator returns true', async () => {
    expect(await not(input => true, 'custom error message')('anything')).toMatchInlineSnapshot(`"custom error message"`);
  });

  it('returns true when validator returns error message', async () => {
    expect(await not(input => 'error message', 'other message')('anything')).toBe(true);
  });
});
