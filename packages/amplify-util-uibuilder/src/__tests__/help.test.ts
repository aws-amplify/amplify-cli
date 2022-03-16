jest.mock('amplify-prompts');
import { printer } from 'amplify-prompts';
import { run } from '../commands/help';
printer.info = jest.fn();
describe('can run help script', () => {
  it('runs help script', async () => {
    await run();
    expect(printer.info).toBeCalledTimes(1);
  });
});
