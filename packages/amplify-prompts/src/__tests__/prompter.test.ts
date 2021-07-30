import { prompter } from '../prompter';
import { prompt } from 'enquirer';
import * as flags from '../flags';

jest.mock('../flags');

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const flags_mock = flags as jest.Mocked<Writeable<typeof flags>>;

jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));

const prompt_mock = prompt as jest.MockedFunction<typeof prompt>;

beforeEach(() => {
  jest.clearAllMocks();
  flags_mock.isYes = false;
});

describe('confirmContinue', () => {
  it('returns true if yes flag set', async () => {
    flags_mock.isYes = true;
    expect(await prompter.confirmContinue()).toBe(true);
    expect(prompt_mock.mock.calls.length).toBe(0);
  });

  it('returns prompt response by default', async () => {
    prompt_mock.mockResolvedValueOnce({ result: true });
    expect(await prompter.confirmContinue()).toBe(true);

    prompt_mock.mockResolvedValueOnce({ result: false });
    expect(await prompter.confirmContinue()).toBe(false);
  });
});

describe('yesOrNo', () => {
  it('returns default value if yes flag set', async () => {
    flags_mock.isYes = true;
    expect(await prompter.yesOrNo('test message', false)).toBe(false);
    expect(await prompter.yesOrNo('test message', true)).toBe(true);
  });

  it('returns prompt response by default', async () => {
    prompt_mock.mockResolvedValueOnce({ result: true });
    expect(await prompter.yesOrNo('test message', false)).toBe(true);
  });
});

describe('input', () => {
  it('throws if yes flag set', async () => {
    flags_mock.isYes = true;
    expect(() => prompter.input('test message')).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot prompt for [test message] when '--yes' flag is set"`,
    );
  });

  it('returns prompt response if no transformer present', async () => {
    const result = 'this is the result';
    prompt_mock.mockResolvedValueOnce({ result });
    expect(await prompter.input('test message')).toEqual(result);
  });

  it('returns transformed response if transformer present', async () => {
    const promptResponse = 'this is the result';
    const transformedValue = 'transformed value';
    prompt_mock.mockResolvedValueOnce({ result: promptResponse });
    expect(await prompter.input('test message', { transform: input => transformedValue })).toEqual(transformedValue);
  });
});

describe('pick', () => {
  it('throws if yes flag set', async () => {
    flags_mock.isYes = true;
    expect(() => prompter.pick('test message', ['opt1'])).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot prompt for [test message] when '--yes' flag is set"`,
    );
  });

  it('throws if no choices provided', async () => {
    expect(() => prompter.pick('test message', [])).rejects.toThrowErrorMatchingInlineSnapshot(
      `"No choices provided for prompt [test message]"`,
    );
  });

  it('returns single option without prompting if only one option provided', async () => {
    expect(await prompter.pick('test message', ['only option'])).toEqual('only option');
    expect(prompt_mock.mock.calls.length).toBe(0);
  });

  it('returns selected item', async () => {
    prompt_mock.mockResolvedValueOnce({ result: 'first opt' });
    expect(await prompter.pick('test message', ['first opt', 'second opt'])).toEqual('first opt');
  });

  it('returns selected items when multiSelect', async () => {
    const mockResult = ['val1', 'val3'];
    prompt_mock.mockResolvedValueOnce({ result: mockResult });
    expect(
      await prompter.pick<'many'>('test message', ['val1', 'val2', 'val3'], { multiSelect: true }),
    ).toEqual(mockResult);
  });
});
