import { alphanumeric, and, integer, maxLength, minLength, not, or, matchRegex } from '../validators';

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
    expect(await and([() => true, () => true])('anything')).toBe(true);
  });

  it('returns first error message', async () => {
    expect(await and([() => true, () => 'first error', () => 'second error'])('anything')).toMatchInlineSnapshot(`"first error"`);
  });

  it('returns override message if any validators return error message', async () => {
    expect(await and([() => true, () => 'first error', () => 'second error'], 'custom error message')('anything')).toMatchInlineSnapshot(
      `"custom error message"`,
    );
  });
});

describe('or', () => {
  it('returns true if one validator returns true', async () => {
    expect(await or([() => 'first error', () => true])('anything')).toBe(true);
  });

  it('returns last error message if all validators return error', async () => {
    expect(await or([() => 'first error', () => 'second error'])('anything')).toMatchInlineSnapshot(`"second error"`);
  });

  it('returns override error mmessage if all validators return error', async () => {
    expect(await or([() => 'first error', () => 'second error'], 'custom message')('anything')).toMatchInlineSnapshot(`"custom message"`);
  });
});

describe('not', () => {
  it('returns error message if validator returns true', async () => {
    expect(await not(() => true, 'custom error message')('anything')).toMatchInlineSnapshot(`"custom error message"`);
  });

  it('returns true when validator returns error message', async () => {
    expect(await not(() => 'error message', 'other message')('anything')).toBe(true);
  });
});

describe('regexpValidator', () => {
  it('returns true for strings matching regexp', () => {
    expect(matchRegex(/^[a-z0-9-]+$/, 'regExp test')('test-logs-20220118')).toBe(true);
  });

  it('returns default error message for strings not matching regexp', () => {
    expect(matchRegex(/^[a-z0-9-]+$/, undefined)('test_logs_*')).toMatchInlineSnapshot(
      `"Input does not match the regular expression /^[a-z0-9-]+$/"`,
    );
  });

  it('returns specified error message for strings not matching regexp', () => {
    expect(matchRegex(/^[a-z0-9-]+$/, 'Only alphanumeric chars and hyphen allowed in string')('test_logs_*')).toMatchInlineSnapshot(
      `"Only alphanumeric chars and hyphen allowed in string"`,
    );
  });
});
