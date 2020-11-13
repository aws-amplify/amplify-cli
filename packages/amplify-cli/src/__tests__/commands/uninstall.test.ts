import { $TSContext } from 'amplify-cli-core';
import { run } from '../../commands/uninstall';
import execa from 'execa';
import * as fs from 'fs-extra';

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;
execa_mock.command.mockResolvedValue({} as any);

jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

let userConfirmation = true;
const context_stub = {
  amplify: {
    confirmPrompt: async () => userConfirmation,
  },
  print: {
    warning: jest.fn(),
    success: jest.fn(),
  },
};

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir/.amplify'),
  },
  isPackaged: false,
}));

const context_stub_typed = (context_stub as unknown) as $TSContext;

describe('uninstall node CLI', () => {
  afterEach(() => {
    userConfirmation = true;
  });
  it('exits early if customer does not confirm uninstall', async () => {
    userConfirmation = false;

    await run(context_stub_typed);

    expect(context_stub.print.warning.mock.calls[0][0]).toMatchInlineSnapshot(`"Not removing the Amplify CLI."`);
  });
  it('proxies npm uninstall', async () => {
    await run(context_stub_typed);

    expect(execa_mock.command.mock.calls[0][0]).toMatchInlineSnapshot(`"npm uninstall -g @aws-amplify/cli"`);
  });

  it('throws if npm fails', async () => {
    execa_mock.command.mockResolvedValueOnce({ stderr: 'some error' } as any);

    await expect(run(context_stub_typed)).rejects.toMatchInlineSnapshot(`
            [Error: [npm uninstall -g @aws-amplify/cli] failed with [some error]
            You'll need to manually uninstall the CLI using npm.]
          `);
  });

  it('removes the .amplify dir', async () => {
    await run(context_stub_typed);

    expect(fs_mock.remove.mock.calls[0][0]).toMatchInlineSnapshot(`"homedir/.amplify"`);
  });

  it('throws if it cannot remove the .amplify dir', async () => {
    fs_mock.remove.mockImplementationOnce(async () => {
      throw new Error('fs remove did not work!');
    });

    await expect(run(context_stub_typed)).rejects.toMatchInlineSnapshot(`
            [Error: Failed to remove [homedir/.amplify]
            You'll need to manually remove this directory.]
          `);
  });
});
