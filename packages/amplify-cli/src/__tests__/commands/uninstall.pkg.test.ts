import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { run } from '../../commands/uninstall';
import execa from 'execa';
import * as fs from 'fs-extra';
import { hideSync } from 'hidefile';
import { setRegPendingDelete } from '../../utils/win-utils';
import { windowsPathSerializer } from '../testUtils/snapshot-serializer';

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;
execa_mock.command.mockResolvedValue({} as any);

jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

const userConfirmation = true;
const context_stub = {
  amplify: {
    confirmPrompt: async () => userConfirmation,
  },
  print: {
    warning: jest.fn(),
    success: jest.fn(),
  },
};

jest.mock('hidefile');
const hideSync_mock = hideSync as jest.MockedFunction<typeof hideSync>;

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir/.amplify'),
  },
  isPackaged: true,
}));

jest.mock('../../utils/win-utils', () => ({
  setRegPendingDelete: jest.fn(),
}));
jest.mock('../../utils/win-constants', () => ({
  pendingDeletePath: 'a/test/path/.amplify-pending-delete.exe',
}));
const setRegPendingDelete_mock = setRegPendingDelete as jest.MockedFunction<typeof setRegPendingDelete>;

// save original process.platform
const originalPlatform = process.platform;

expect.addSnapshotSerializer(windowsPathSerializer);

const context_stub_typed = context_stub as unknown as $TSContext;

describe('uninstall packaged CLI on mac / linux', () => {
  beforeAll(() => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('removes the .amplify dir', async () => {
    await run(context_stub_typed);

    expect(fs_mock.remove.mock.calls[0][0]).toMatchInlineSnapshot(`"homedir/.amplify"`);
  });

  it('throws if it cannot remove the .amplify dir', async () => {
    fs_mock.remove.mockImplementationOnce(() => {
      throw new Error('fs remove did not work!');
    });

    await expect(run(context_stub_typed)).rejects.toMatchInlineSnapshot(`
            [Error: Failed to remove [homedir/.amplify]
            You'll need to manually remove this directory.]
          `);
  });
});

describe('uninstall packaged CLI on windows', () => {
  beforeAll(() => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('moves the current binary out of the .amplify dir before removing .amplify dir', async () => {
    let movedBinToTemp = false;
    fs_mock.move.mockImplementationOnce(() => {
      movedBinToTemp = true;
    });
    fs_mock.remove.mockImplementationOnce(() => {
      if (!movedBinToTemp) throw new Error('did not move bin out of .amplify dir first!');
    });

    await run(context_stub_typed);

    expect(fs_mock.move.mock.calls[0]).toMatchInlineSnapshot(`
[
  "homedir/.amplify/bin/amplify.exe",
  "a/test/path/.amplify-pending-delete.exe",
  {
    "overwrite": true,
  },
]
`);
    expect(fs_mock.remove.mock.calls[0][0]).toMatchInlineSnapshot(`"homedir/.amplify"`);
  });

  it('sets new binary location to hidden', async () => {
    await run(context_stub_typed);

    expect(hideSync_mock.mock.calls[0][0]).toMatchInlineSnapshot(`"a/test/path/.amplify-pending-delete.exe"`);
  });

  it('sets registry pending deletion value', async () => {
    await run(context_stub_typed);

    expect(setRegPendingDelete_mock.mock.calls.length).toBe(1);
  });
});
