import * as fs from 'fs-extra';
import execa from 'execa';
import { run } from '../../commands/upgrade';
import fetch from 'node-fetch';
import { $TSContext } from 'amplify-cli-core';
import * as core from 'amplify-cli-core';

jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;

jest.mock('node-fetch');
const fetch_mock = fetch as jest.Mocked<typeof fetch>;

const context_stub = {
  print: {
    success: jest.fn(),
    info: jest.fn(),
  },
};

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir'),
  },
  isPackaged: false,
}));

const context_stub_typed = context_stub as $TSContext;

describe('run upgrade using node CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('exits early if no new version available', async () => {
    // setup
    execa_mock.command.mockResolvedValueOnce({ stdout: '1.0.0' } as any);

    // test
    await run(context_stub_typed);

    // validate
    expect(context_stub.print.info.mock.calls[0][0]).toMatchInlineSnapshot(`"This is the latest Amplify CLI version."`);
  });

  it('upgrades CLI using npm', async () => {
    // setup
    execa_mock.command.mockResolvedValueOnce({ stdout: '100.0.0' } as any); // we will all be dead by the time v 100 launches

    // test
    await run(context_stub_typed);

    // validate
    expect(execa_mock.command.mock.calls.length).toBe(2);
    expect(execa_mock.command.mock.calls[1][0]).toMatchInlineSnapshot(`"npm i -g @aws-amplify/cli"`);
  });
});
