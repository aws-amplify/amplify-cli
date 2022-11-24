/* eslint-disable spellcheck/spell-checker */
import * as fs from 'fs-extra';
import { fs as vfs } from 'memfs';
import {
  existsVFSSync, copyFromVFStoFSSync, deleteBackendSnapshotVFS, takeBackendSnapshotVFS,
} from '../../utils/vfs-helpers';

const fsMock = fs as jest.Mocked<typeof fs>;
const vfsMock = vfs as jest.Mocked<typeof vfs>;

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockBackendDirPath'),
    getBackendSnapshotVFSPath: jest.fn().mockReturnValue('.mock_snapshot'),
  },
}));

describe('VFSHelperFunctions', () => {
  beforeAll(() => {
    jest.clearAllMocks();

    fsMock.mkdirSync('mockBackendDirPath', { recursive: true });
    fsMock.mkdirSync('mockBackendDirPath/mockDir', { recursive: true });
    fsMock.mkdirSync('mockCloudCurrentResourcesPath', { recursive: true });
    fsMock.writeFileSync('mockBackendDirPath/file1.txt', 'file1');
    fsMock.writeFileSync('mockBackendDirPath/file2.txt', 'file2');
    fsMock.writeFileSync('mockBackendDirPath/file3.txt', 'file3');
    fsMock.writeFileSync('mockBackendDirPath/mockDir/file1.txt', 'file1');
  });

  it('should take a snapshot of the directory and place it in the vfs', () => {
    takeBackendSnapshotVFS();
    expect(vfsMock.readFileSync('.mock_snapshot/file1.txt', 'utf8')).toBe('file1');
    expect(vfsMock.readFileSync('.mock_snapshot/file2.txt', 'utf8')).toBe('file2');
    expect(vfsMock.readFileSync('.mock_snapshot/file3.txt', 'utf8')).toBe('file3');
    expect(vfsMock.readFileSync('.mock_snapshot/mockDir/file1.txt', 'utf8')).toBe('file1');
    deleteBackendSnapshotVFS();
  });

  it('should copy files from the VFS to the file system', () => {
    takeBackendSnapshotVFS();
    copyFromVFStoFSSync('.mock_snapshot', 'mockCloudCurrentResourcesPath');
    expect(fsMock.readFileSync('mockCloudCurrentResourcesPath/file1.txt', 'utf8')).toBe('file1');
    expect(fsMock.readFileSync('mockCloudCurrentResourcesPath/file2.txt', 'utf8')).toBe('file2');
    expect(fsMock.readFileSync('mockCloudCurrentResourcesPath/file3.txt', 'utf8')).toBe('file3');
    expect(fsMock.readFileSync('mockCloudCurrentResourcesPath/mockDir/file1.txt', 'utf8')).toBe('file1');
  });

  it('should delete the snapshot from the vfs', () => {
    takeBackendSnapshotVFS();
    deleteBackendSnapshotVFS();
    expect(vfsMock.existsSync('.mock_snapshot')).toBe(false);
  });

  it('should assert the existance of a file in the vfs', () => {
    takeBackendSnapshotVFS();
    expect(existsVFSSync('.mock_snapshot/file1.txt')).toBe(true);
    expect(existsVFSSync('.mock_snapshot/nonExistant.txt')).toBe(false);
  });
});
