import * as child_process from 'child_process';
import { Binary } from '../binary';

jest.mock('child_process', () => ({
  spawnSync: jest.fn().mockReturnValue({ status: 0 }),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('which-pm-runs', () => jest.fn().mockReturnValue({ name: 'pnpm' }));

describe('amplify-cli Binary', () => {
  // copy the original process.argv (e.g. ['node', 'jest', ...])
  const originalProcessArgv = [...process.argv];

  afterEach(() => {
    // reset process.argv to its original value
    process.argv = originalProcessArgv;
  });

  it('should uninstall itself using the package manager it was installed with', async () => {
    const processSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never;
    });

    // create the test binary
    const binary = new Binary();
    // push 'uninstall' args to process.argv for it to then be consumed by binary.run()
    process.argv = ['node', 'amplify', 'uninstall', '--yes'];
    // run the binary with the 'uninstall' args
    await binary.run();

    // define pnpm uninstall command
    const [pnpm, ...args] = 'pnpm uninstall --global @aws-amplify/cli'.split(' ');

    expect(child_process.spawnSync).toHaveBeenLastCalledWith(pnpm, args, { cwd: process.cwd(), stdio: 'inherit' });
  });
});
