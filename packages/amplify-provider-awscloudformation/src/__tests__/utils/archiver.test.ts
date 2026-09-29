const archiver = require('../../utils/archiver');
const archiverLib = require('archiver');
const path = require('path');
const fs = require('fs-extra');

const mockZip = {
  pipe: jest.fn(),
  glob: jest.fn(),
  file: jest.fn(),
  finalize: jest.fn(),
};

const mockWriteStream = {
  on: jest.fn().mockImplementation(function (this, event, handler) {
    if (event === 'close') {
      handler();
    }
    return this;
  }),
};

jest.mock('path');
jest.mock('fs-extra');
jest.mock('archiver');

describe('run archiver', () => {
  test('test archiver.run function zips successfully', async () => {
    path.dirname.mockImplementation(() => 'TestZipFolderName');
    path.basename.mockImplementation(() => 'TestZipFileName');
    fs.createWriteStream.mockImplementation(() => mockWriteStream);
    archiverLib.create.mockImplementation(() => mockZip);

    const res = await archiver.run('testFolder', 'testZipFilePath');

    expect(res).toEqual({ zipFilePath: 'testZipFilePath', zipFilename: 'TestZipFileName' });
    expect(fs.ensureDir).toBeCalledWith('TestZipFolderName');
    expect(path.basename).toBeCalled();
    expect(mockZip.glob).toHaveBeenCalledWith('api/*/build/**', {
      cwd: 'testFolder',
      dot: true,
    });
    expect(mockZip.finalize).toBeCalled();
  });

  test('test archiver.run function handles error if zipping fails', async () => {
    const mockFailedWriteStream = {
      on: jest.fn().mockImplementation(function (this, event, handler) {
        if (event === 'error') {
          handler();
        }
        return this;
      }),
    };

    fs.createWriteStream.mockImplementation(() => mockFailedWriteStream);
    archiverLib.create.mockImplementation(() => mockZip);

    await expect(archiver.run('testFolder', 'testZipFilePath')).rejects.toThrowErrorMatchingInlineSnapshot('"Failed to zip code."');
  });

  test('test archiver.run function zips successfully if extraFiles arg provided', async () => {
    path.basename.mockImplementation(() => 'TestZipFileName');
    fs.createWriteStream.mockImplementation(() => mockWriteStream);
    archiverLib.create.mockImplementation(() => mockZip);

    await archiver.run('testFolder', 'testZipFilePath', undefined, ['testFilePath1', 'testFilePath2']);
    expect(mockZip.file.mock.calls).toEqual([
      ['testFilePath1', { name: 'TestZipFileName' }],
      ['testFilePath2', { name: 'TestZipFileName' }],
    ]);
  });
});
