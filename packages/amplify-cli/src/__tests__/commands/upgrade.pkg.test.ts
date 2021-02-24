import * as fs from 'fs-extra';
import { run } from '../../commands/upgrade';
import fetch, { Response } from 'node-fetch';
import { $TSContext } from 'amplify-cli-core';
import * as core from 'amplify-cli-core';

jest.mock('fs-extra');
const fs_mock = (fs as unknown) as jest.Mocked<typeof fs>;

jest.mock('node-fetch');
const fetch_mock = fetch as jest.MockedFunction<typeof fetch>;

const context_stub = {
  print: {
    success: jest.fn(),
    info: jest.fn(),
  },
};

jest.mock('gunzip-maybe');

jest.mock('progress');

jest.mock('tar-fs');

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir'),
  },
  isPackaged: true,
}));

const mockStream = {
  on: jest.fn().mockImplementation((_, callback) => {
    callback('binary data');
    return mockStream;
  }),
  pipe: jest.fn().mockImplementation(() => mockStream),
};

const core_mock = core as jest.Mocked<typeof core>;
core_mock.pathManager.getHomeDotAmplifyDirPath = jest.fn().mockReturnValue('homedir');

const context_stub_typed = (context_stub as unknown) as $TSContext;

// save original process.platform
const originalPlatform = process.platform;

describe('run upgrade using packaged CLI', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('exits early if no new packaged version available', async () => {
    // setup
    fetch_mock.mockResolvedValueOnce(({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({
        tag_name: 'v1.0.0',
      }),
    } as unknown) as Response);

    // test
    await run(context_stub_typed);

    // validate
    expect(context_stub.print.info.mock.calls[0][0]).toMatchInlineSnapshot(`"This is the latest Amplify CLI version."`);
  });

  it('upgrades packaged CLI using GitHub releases', async () => {
    // setup
    fetch_mock
      .mockResolvedValueOnce(({
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          tag_name: 'v100.0.0',
        }),
      } as unknown) as Response)
      .mockResolvedValueOnce(({
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('100'),
        },
        body: mockStream,
      } as unknown) as Response);

    // override process.platform
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    });

    // test
    await run(context_stub_typed);

    // validate
    expect(fs_mock.move.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify-pkg-linux",
        "homedir/bin/amplify",
        Object {
          "overwrite": true,
        },
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
      .mockResolvedValueOnce(({
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          tag_name: 'v100.0.0',
        }),
      } as unknown) as Response)
      .mockResolvedValueOnce(({
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('100'),
        },
        body: mockStream,
      } as unknown) as Response);
    let movedBinToTemp = false;
    fs_mock.move
      .mockImplementationOnce(async () => {
        movedBinToTemp = true;
      })
      .mockImplementationOnce(async () => {
        if (!movedBinToTemp) throw new Error('fs.move was not called before copying extracted file to bin location');
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
    expect(fs_mock.move.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify-pkg-win.exe",
        "homedir/bin/amplify.exe",
        Object {
          "overwrite": true,
        },
      ]
    `);
    expect(fs_mock.chmod.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "homedir/bin/amplify.exe",
        "700",
      ]
    `);
  });

  it('throws error if binary download fails', async () => {});
});
