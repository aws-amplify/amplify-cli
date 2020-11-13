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
  isPackaged: true,
}));

const core_mock = core as jest.Mocked<typeof core>;
core_mock.pathManager.getHomeDotAmplifyDirPath = jest.fn().mockReturnValue('homedir');

const context_stub_typed = context_stub as $TSContext;

// save original process.platform
const originalPlatform = process.platform;

describe('run upgrade using packaged CLI', () => {
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('exits early if no new packaged version available', async () => {
    // setup
    fetch_mock.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({
        tag_name: 'v1.0.0',
      }),
    });

    // test
    await run(context_stub_typed);

    // validate
    expect(context_stub.print.info.mock.calls[0][0]).toMatchInlineSnapshot(`"This is the latest Amplify CLI version."`);
  });

  it('upgrades packaged CLI using GitHub releases', async () => {
    // setup
    fetch_mock
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          tag_name: 'v100.0.0',
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        buffer: jest.fn().mockResolvedValueOnce('binary data'),
      });

    // test
    await run(context_stub_typed);

    // validate
    expect(fs_mock.writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify",
        "binary data",
      ]
    `);
    expect(fs_mock.chmod.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify",
        "700",
      ]
    `);
  });

  it('moves old binary to temp location before downloading on windows', async () => {
    // setup
    fetch_mock
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          tag_name: 'v100.0.0',
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        buffer: jest.fn().mockResolvedValueOnce('binary data'),
      });
    let movedBinToTemp = false;
    fs_mock.move.mockImplementationOnce(async () => {
      movedBinToTemp = true;
    });
    fs_mock.writeFile.mockImplementationOnce(async () => {
      if (!movedBinToTemp) throw new Error('fs.move was not called before downloading the binary on windows');
    });

    // override process.platform
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });

    // test
    await run(context_stub_typed);

    // validate
    expect(fs_mock.move.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify.exe",
        "homedir/bin/amplify-old.exe",
      ]
    `);
    expect(fs_mock.writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify",
        "binary data",
      ]
    `);
    expect(fs_mock.chmod.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify",
        "700",
      ]
    `);
  });

  it('throws error if binary download fails', async () => {});
});
