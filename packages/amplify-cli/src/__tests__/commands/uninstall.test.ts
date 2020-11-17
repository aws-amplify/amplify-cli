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
  it('does nothing when running using node', async () => {
    await run(context_stub_typed);

    expect(context_stub.print.warning.mock.calls[0][0]).toMatchInlineSnapshot(`
      "\\"uninstall\\" is not available in this installation of Amplify.
      Use [94mnpm uninstall -g @aws-amplify/cli[39m"
    `);
  });
});
