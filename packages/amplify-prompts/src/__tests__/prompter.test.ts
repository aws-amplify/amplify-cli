import { prompt } from 'enquirer';
import { byValue, byValues, prompter } from '../prompter';
import * as flags from '../flags';

jest.mock('../flags');

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const flagsMock = flags as jest.Mocked<Writeable<typeof flags>>;

jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));

const promptMock = prompt as jest.MockedFunction<typeof prompt>;

beforeEach(async () => {
  flagsMock.isYes = false;
  flagsMock.isInteractiveShell = true;
  jest.clearAllMocks();
});

describe('confirmContinue', () => {
  it('returns true if yes flag set', async () => {
    flagsMock.isYes = true;
    expect(await prompter.confirmContinue()).toBe(true);
    expect(promptMock.mock.calls.length).toBe(0);
  });

  it('returns prompt response by default', async () => {
    promptMock.mockResolvedValueOnce({ result: true });
    expect(await prompter.confirmContinue()).toBe(true);

    promptMock.mockResolvedValueOnce({ result: false });
    expect(await prompter.confirmContinue()).toBe(false);
  });

  it('throws error if non-interactive shell', async () => {
    flagsMock.isInteractiveShell = false;
    await expect(() => prompter.confirmContinue()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Cannot prompt for [Do you want to continue?] in a non-interactive shell"',
    );
  });
});

describe('yesOrNo', () => {
  it('returns default value if yes flag set', async () => {
    flagsMock.isYes = true;
    expect(await prompter.yesOrNo('test message', false)).toBe(false);
    expect(await prompter.yesOrNo('test message', true)).toBe(true);
    expect(promptMock).not.toBeCalled();
  });

  it('returns prompt response by default', async () => {
    promptMock.mockResolvedValueOnce({ result: true });
    expect(await prompter.yesOrNo('test message', false)).toBe(true);
  });

  it('throws error if non-interactive shell', async () => {
    flagsMock.isInteractiveShell = false;
    await expect(() => prompter.yesOrNo('test message')).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Cannot prompt for [test message] in a non-interactive shell"',
    );
  });
});

describe('input', () => {
  it('throws if yes flag set and no initial value', async () => {
    flagsMock.isYes = true;
    await expect(() => prompter.input('test message')).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Cannot prompt for [test message] when \'--yes\' flag is set"',
    );
  });

  it('throws if non-interactive shell and yes flag false', async () => {
    flagsMock.isInteractiveShell = false;
    await expect(() => prompter.input('test message')).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Cannot prompt for [test message] in a non-interactive shell"',
    );
  });

  it('returns initial value without prompt if yes flag set', async () => {
    flagsMock.isYes = true;
    expect(await prompter.input('test message', { initial: 'initial value' })).toEqual('initial value');
    expect(promptMock.mock.calls.length).toBe(0);
  });

  it('returns prompt response if no transformer present', async () => {
    const result = 'this is the result';
    promptMock.mockResolvedValueOnce({ result });
    expect(await prompter.input('test message')).toEqual(result);
  });

  it('returns transformed response if transformer present', async () => {
    const promptResponse = 'this is the result';
    const transformedValue = 'transformed value';
    promptMock.mockResolvedValueOnce({ result: promptResponse });
    expect(await prompter.input('test message', { transform: () => transformedValue })).toEqual(transformedValue);
  });

  it('transforms each input part separately when "many" specified', async () => {
    promptMock.mockResolvedValueOnce({ result: ['10', '20'] });
    expect(await prompter.input<'many'>('test message', { returnSize: 'many', transform: (input) => `${input}suffix` })).toEqual([
      '10suffix',
      '20suffix',
    ]);
  });
});

describe('pick', () => {
  it('throws if yes flag set and multiple options provided', async () => {
    flagsMock.isYes = true;
    await expect(() => prompter.pick('test message', ['opt1', 'opt2'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Cannot prompt for [test message] when \'--yes\' flag is set"',
    );
  });

  it('throws if non-interactive shell and yes flag false', async () => {
    flagsMock.isInteractiveShell = false;
    await expect(() => prompter.pick('test message', ['opt1', 'opt2'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Cannot prompt for [test message] in a non-interactive shell"',
    );
  });

  it('returns single option when yes flag set if only one option is provided', async () => {
    flagsMock.isYes = true;
    expect(await prompter.pick('test message', ['opt1'])).toEqual('opt1');
    expect(promptMock.mock.calls.length).toBe(0);
  });

  it('returns initial selection if specified when yes flag is set', async () => {
    flagsMock.isYes = true;
    const result = await prompter.pick<'many'>('test message', ['opt1', 'opt2', 'opt3'], { returnSize: 'many', initial: [1, 2] });
    expect(result).toEqual(['opt2', 'opt3']);
    expect(promptMock.mock.calls.length).toBe(0);
  });

  it('computes selection index using selection function', async () => {
    promptMock.mockResolvedValueOnce({ result: 'opt2' });
    await prompter.pick('test message', ['opt1', 'opt2', 'opt3'], { initial: byValue('opt2') });
    expect((promptMock.mock.calls[0][0] as any).initial).toBe(1);
  });

  it('returns initial selection using selection function when yes flag is set', async () => {
    flagsMock.isYes = true;
    const result = await prompter.pick('test message', ['opt1', 'opt2', 'opt3'], { initial: byValue('opt2') });
    expect(result).toBe('opt2');
    expect(promptMock.mock.calls.length).toBe(0);
  });

  it('throws if no choices provided', async () => {
    await expect(() => prompter.pick('test message', [])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"No choices provided for prompt [test message]"',
    );
  });

  it('returns single option without prompting if only one option provided', async () => {
    expect(await prompter.pick('test message', ['only option'])).toEqual('only option');
    expect(promptMock.mock.calls.length).toBe(0);
  });

  it('returns selected item', async () => {
    promptMock.mockResolvedValueOnce({ result: 'first opt' });
    expect(await prompter.pick('test message', ['first opt', 'second opt'])).toEqual('first opt');
  });

  it('returns selected items when multiSelect', async () => {
    const mockResult = ['val1', 'val3'];
    promptMock.mockResolvedValueOnce({ result: mockResult });
    expect(await prompter.pick<'many'>('test message', ['val1', 'val2', 'val3'], { returnSize: 'many' })).toEqual(mockResult);
  });

  it('returns array of single item if only one choice specified and must pick at least 1', async () => {
    expect(await prompter.pick<'many'>('test message', ['hello'], { returnSize: 'many', pickAtLeast: 1 })).toEqual(['hello']);
    expect(promptMock).toHaveBeenCalledTimes(0);
  });

  it('returns array of all choices if must pick at lest that many options', async () => {
    expect(await prompter.pick<'many'>('test message', ['hello', 'hey'], { returnSize: 'many', pickAtLeast: 3 })).toEqual(['hello', 'hey']);
    expect(promptMock).toHaveBeenCalledTimes(0);
  });

  it('prompts for selection when only one option with returnSize as many', async () => {
    promptMock.mockResolvedValueOnce({ result: ['hello'] });
    expect(await prompter.pick<'many'>('test message', ['hello'], { returnSize: 'many' })).toEqual(['hello']);
    expect(promptMock).toHaveBeenCalled();
  });

  it('prompts for selection when pick at least is less than options length', async () => {
    promptMock.mockResolvedValueOnce({ result: ['hello', 'hey'] });
    expect(await prompter.pick<'many'>('test message', ['hello', 'hey', 'hi'], { returnSize: 'many', pickAtLeast: 2 })).toEqual([
      'hello',
      'hey',
    ]);
    expect(promptMock).toHaveBeenCalled();
  });
});

describe('byValue', () => {
  it('defaults to === when no equals function specified', () => {
    expect(byValue('fox')(['the', 'quick', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'])).toBe(2);
  });

  it('returns the index of the first match if multiple present', () => {
    expect(byValue('the')(['the', 'quick', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'])).toBe(0);
  });

  it('returns undefined when no match found', () => {
    expect(byValue('dne')(['the', 'quick', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'])).toBeUndefined();
  });

  it('uses the equals function if specified', () => {
    expect(byValue('four', (a, b) => a.length === b.length)(['the', 'quick', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'])).toBe(4);
  });
});

describe('byValues', () => {
  it('defaults to === when no equals function specified', () => {
    expect(byValues(['fox', 'the'])(['the', 'quick', 'fox', 'jumped', 'over', 'lazy', 'dog']).sort()).toEqual([0, 2]);
  });

  it('returns [] when no matches found', () => {
    expect(byValues(['dne'])(['the', 'quick', 'fox', 'jumped', 'over', 'the', 'lazy', 'dog'])).toEqual([]);
  });

  it('uses the equals function if specified', () => {
    // eslint-disable-next-line spellcheck/spell-checker
    expect(byValues(['a', 'aa'], (a, b) => a.length === b.length)(['bbbb', 'bb', 'bbb', 'b']).sort()).toEqual([1, 3]);
  });
});
