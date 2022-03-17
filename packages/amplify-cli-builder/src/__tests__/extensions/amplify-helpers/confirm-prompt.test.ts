import { confirmPrompt } from '../../../extensions/amplify-helpers/confirm-prompt';

jest.mock('inquirer', () => {
  return {
    prompt: input => {
      return new Promise(resolve => resolve({ yesno: input }));
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
