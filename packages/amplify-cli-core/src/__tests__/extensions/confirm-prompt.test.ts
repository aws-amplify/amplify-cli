import { toolkitExtensions } from '../..';
const { confirmPrompt } = toolkitExtensions;

jest.mock('inquirer', () => {
  return {
    prompt: (input: string) => {
      return new Promise((resolve) => resolve({ yesno: input }));
    },
  };
});

describe('confirmPrompt', () => {
  it('returns an object', async () => {
    const result = await confirmPrompt('test', true);
    expect(result).toStrictEqual({
      name: 'yesno',
      message: 'test',
      type: 'confirm',
      default: true,
    });
  });
});
