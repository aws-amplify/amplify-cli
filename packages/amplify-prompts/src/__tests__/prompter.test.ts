import { prompter } from '../prompter';

describe('prompter', () => {
  it('confirms', async () => {
    const result = await prompter.confirmContinue('Do you want to continue');
    console.log(result);
  });
});
