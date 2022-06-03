/* eslint-disable jest/no-interpolation-in-snapshots */
import * as fs from 'fs-extra';
import fetch, { Response } from 'node-fetch';
import { $TSContext } from 'amplify-cli-core';
import * as core from 'amplify-cli-core';
import * as path from 'path';
import execa from 'execa';
import { run } from '../../commands/upgrade';
import { windowsPathSerializer } from '../testUtils/snapshot-serializer';

jest.mock('fs-extra');
const fsMock = fs as unknown as jest.Mocked<typeof fs>;

jest.mock('node-fetch');
const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

jest.mock('util', () => ({
  ...(jest.requireActual('util') as Record<string, unknown>),
  promisify: jest.fn().mockReturnValue(() => () => {}),
}));
jest.mock('stream');

jest.mock('ora', () => () => ({
  ...(jest.requireActual('ora') as Record<string, unknown>),
  start: jest.fn(),
  stop: jest.fn(),
  succeed: jest.fn(),
}));

jest.mock('execa');
const mockCLIVersion = '8.0.1';
const execaMock = execa as jest.MockedFunction<typeof execa>;
(execaMock as any).mockImplementation(async () => ({ stdout: mockCLIVersion }));

const contextStub = {
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

const coreMock = core as jest.Mocked<typeof core>;
coreMock.pathManager.getHomeDotAmplifyDirPath = jest.fn().mockReturnValue('homedir');

const contextStubTyped = contextStub as unknown as $TSContext;

// save original process.platform
const originalPlatform = process.platform;
expect.addSnapshotSerializer(windowsPathSerializer);

describe('run upgrade using packaged CLI', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('exits early if no new packaged version available', async () => {
    // setup
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({
        tag_name: 'v1.0.0',
      }),
    } as unknown as Response);

    // test
    await run(contextStubTyped);

    // validate
    expect(contextStub.print.info.mock.calls[0][0]).toMatchInlineSnapshot('"This is the latest Amplify CLI version."');
  });

  it('upgrades packaged CLI using GitHub releases', async () => {
    // setup
    fetchMock
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          tag_name: 'v100.0.0',
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('100'),
        },
        body: mockStream,
      } as unknown as Response);

    // override process.platform
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    });

    // test
    await run(contextStubTyped);

    // validate
    expect(fsMock.move.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "${path.join('homedir', 'bin', 'amplify-pkg-linux')}",
        "${path.join('homedir', 'bin', 'amplify')}",
        Object {
          "overwrite": true,
        },
      ]
    `);

    expect(fsMock.chmod.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "${path.join('homedir', 'bin', 'amplify')}",
        "700",
      ]
    `);
  });

  it('moves old binary to temp location before downloading on windows', async () => {
    // setup
    fetchMock
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          tag_name: 'v100.0.0',
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('100'),
        },
        body: mockStream,
      } as unknown as Response);

    let movedBinToTemp = false;
    fsMock.move
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

    // override platform.exit
    Object.defineProperty(process, 'exit', jest.fn);

    // test
    await run(contextStubTyped);

    // validate
    expect(fsMock.move.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "${path.join('homedir', 'bin', 'amplify.exe')}",
        "${path.join('homedir', 'bin', 'amplify-old.exe')}",
      ]
    `);
    expect(fsMock.move.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        "${path.join('homedir', 'bin', 'amplify-pkg-win.exe')}",
        "${path.join('homedir', 'bin', 'amplify.exe')}",
        Object {
          "overwrite": true,
        },
      ]
    `);
    expect(fsMock.chmod.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "${path.join('homedir', 'bin', 'amplify.exe')}",
        "700",
      ]
    `);
  });

  it('throws error if binary download fails', async () => {});
});
