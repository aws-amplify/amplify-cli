import { printer } from '@aws-amplify/amplify-prompts';
import { run } from '../commands/version';
jest.mock('@aws-amplify/amplify-prompts');
printer.info = jest.fn();
describe('can run version script', () => {
  it('runs version script', async () => {
    await run();
    expect(printer.info).toBeCalledTimes(1);
  });
});
