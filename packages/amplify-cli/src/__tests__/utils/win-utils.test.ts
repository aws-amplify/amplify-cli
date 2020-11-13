import * as fs from 'fs-extra';
import { deleteOldVersion, setRegPendingDelete } from '../../utils/win-utils';
import execa from 'execa';

// save original process.platform
const originalPlatform = process.platform;

jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;
fs_mock.existsSync.mockReturnValue(true);

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir/.amplify'),
  },
}));

jest.mock('../../utils/win-constants', () => ({
  oldVersionPath: 'homedir/.amplify/bin/amplify-old.exe',
  pendingDeletePath: 'homedir/pending-delete.exe',
  tmpRegPath: '/tmp/path',
}));

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;

describe('delete old version', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('doesnt do anything if not on windows', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
    deleteOldVersion();
    expect(fs_mock.removeSync.mock.calls.length).toBe(0);
  });

  it('doesnt do anything if old version doesnt exist', () => {
    fs_mock.existsSync.mockReturnValueOnce(false);
    deleteOldVersion();
    expect(fs_mock.removeSync.mock.calls.length).toBe(0);
  });

  it('removes old version when present', () => {
    deleteOldVersion();
    expect(fs_mock.removeSync.mock.calls[0][0]).toMatchInlineSnapshot(`"homedir/.amplify/bin/amplify-old.exe"`);
  });

  it('prints warning if old version cannot be deleted', () => {
    const consoleWarnSpy = jest.spyOn(global.console, 'warn');
    fs_mock.removeSync.mockImplementationOnce(() => {
      throw new Error('test error removing old binary');
    });
    deleteOldVersion();
    expect(consoleWarnSpy.mock.calls.length).toBe(2);
    expect(consoleWarnSpy.mock.calls[0][0]).toMatchInlineSnapshot(
      `"Failed to clean up previous CLI installation at [homedir/.amplify/bin/amplify-old.exe]."`,
    );
    expect(consoleWarnSpy.mock.calls[1][0]).toMatchInlineSnapshot(`"Make sure this file is not open anywhere else."`);
  });
});

describe('set registry pending delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('doesnt do anything if not on windows', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
    await setRegPendingDelete();
    expect(execa_mock.command.mock.calls.length).toBe(0);
  });

  it('handles regKey does not exist', async () => {
    execa_mock.command.mockImplementationOnce(() => {
      throw new Error('error when reg key does not exist');
    });
    await setRegPendingDelete();
    expect(fs_mock.writeFile.mock.calls[0][1]).toMatchSnapshot();
  });

  it('handles regKey empty', async () => {
    execa_mock.command.mockResolvedValueOnce({ stdout: '' } as any);
    await setRegPendingDelete();
    expect(fs_mock.writeFile.mock.calls[0][1]).toMatchSnapshot();
  });

  it('handles unicode characters in registry', async () => {
    execa_mock.command.mockResolvedValueOnce({ stdout: '\\??\\C:\\ĐĦŉ\\你好.txt\\0' } as any);
    await setRegPendingDelete();
    expect(fs_mock.writeFile.mock.calls[0][1]).toMatchSnapshot();
  });

  it('writes reg import file, imports and cleans up import file', async () => {
    let writtenFile = false;
    let importedFile = false;
    fs_mock.writeFile.mockImplementationOnce(() => {
      writtenFile = true;
    });
    execa_mock.command.mockResolvedValueOnce({ stdout: '' } as any).mockImplementationOnce((() => {
      if (!writtenFile) throw new Error('did not write to import file before importing!');
      importedFile = true;
    }) as any);
    fs_mock.remove.mockImplementationOnce(() => {
      if (!importedFile) throw new Error('removed import file before importing!');
    });

    await setRegPendingDelete();
    const tmpRegPath = '/tmp/path';
    expect(fs_mock.writeFile.mock.calls[0][0]).toEqual(tmpRegPath);
    expect(fs_mock.writeFile.mock.calls[0][1]).toMatchSnapshot();
    expect(execa_mock.command.mock.calls[1][0]).toEqual(`reg import "${tmpRegPath}"`);
    expect(fs_mock.remove.mock.calls[0][0]).toEqual(tmpRegPath);
  });
});
