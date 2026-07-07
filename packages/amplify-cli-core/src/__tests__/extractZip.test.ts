import * as fs from 'fs-extra';
import * as path from 'path';
import * as archiver from 'archiver';
import { extract } from '@aws-amplify/amplify-cli-core';
import * as os from 'os';

describe('extract zip', () => {
  let tempDir: string;
  let inputDir: string;
  let outputDir: string;
  let zipFilePath: string;
  const file1RelativePath = 'file1.txt';
  const file1Content = Math.random().toString();
  const file2RelativePath = 'file2.txt';
  const file2Content = Math.random().toString();
  const dir1RelativePath = 'dir1';
  const file3RelativePath = path.join(dir1RelativePath, 'file3.txt');
  const file3Content: string = Math.random().toString();
  const dir2RelativePath = 'dir2';
  const file4RelativePath = path.join(dir2RelativePath, 'file4.txt');
  const file4Content: string = Math.random().toString();

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'extractZipTest'));
    inputDir = path.join(tempDir, 'inputDir');
    outputDir = path.join(tempDir, 'outputDir');
    fs.mkdirSync(inputDir);
    fs.mkdirSync(path.join(inputDir, 'dir1'));
    fs.mkdirSync(path.join(inputDir, 'dir2'));
    fs.writeFileSync(path.join(inputDir, file1RelativePath), file1Content);
    fs.writeFileSync(path.join(inputDir, file2RelativePath), file2Content);
    fs.writeFileSync(path.join(inputDir, file3RelativePath), file3Content);
    fs.writeFileSync(path.join(inputDir, file4RelativePath), file4Content);

    zipFilePath = path.join(tempDir, 'archive.zip');
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver.create('zip', {});
    archive.pipe(output);
    archive.directory(inputDir, false);
    await archive.finalize();
  });

  beforeEach(() => {
    fs.removeSync(outputDir);
  });

  afterAll(() => {
    fs.removeSync(tempDir);
  });

  it('should extract full zip', async () => {
    await extract(zipFilePath, { dir: outputDir });
    expect(fs.existsSync(path.join(outputDir, dir1RelativePath))).toStrictEqual(true);
    expect(fs.existsSync(path.join(outputDir, dir2RelativePath))).toStrictEqual(true);
    expect(fs.readFileSync(path.join(outputDir, file1RelativePath), 'utf-8')).toStrictEqual(file1Content);
    expect(fs.readFileSync(path.join(outputDir, file2RelativePath), 'utf-8')).toStrictEqual(file2Content);
    expect(fs.readFileSync(path.join(outputDir, file3RelativePath), 'utf-8')).toStrictEqual(file3Content);
    expect(fs.readFileSync(path.join(outputDir, file4RelativePath), 'utf-8')).toStrictEqual(file4Content);
  });

  it('should skip directory', async () => {
    await extract(zipFilePath, {
      dir: outputDir,
      skipEntryPrefixes: [dir1RelativePath],
    });
    expect(fs.existsSync(path.join(outputDir, dir1RelativePath))).toStrictEqual(false);
    expect(fs.existsSync(path.join(outputDir, dir2RelativePath))).toStrictEqual(true);
    expect(fs.readFileSync(path.join(outputDir, file1RelativePath), 'utf-8')).toStrictEqual(file1Content);
    expect(fs.readFileSync(path.join(outputDir, file2RelativePath), 'utf-8')).toStrictEqual(file2Content);
    expect(fs.existsSync(path.join(outputDir, file3RelativePath))).toStrictEqual(false);
    expect(fs.readFileSync(path.join(outputDir, file4RelativePath), 'utf-8')).toStrictEqual(file4Content);
  });

  it('should skip top level file', async () => {
    await extract(zipFilePath, {
      dir: outputDir,
      skipEntryPrefixes: [file1RelativePath],
    });
    expect(fs.existsSync(path.join(outputDir, dir1RelativePath))).toStrictEqual(true);
    expect(fs.existsSync(path.join(outputDir, dir2RelativePath))).toStrictEqual(true);
    expect(fs.existsSync(path.join(outputDir, file1RelativePath))).toStrictEqual(false);
    expect(fs.readFileSync(path.join(outputDir, file2RelativePath), 'utf-8')).toStrictEqual(file2Content);
    expect(fs.readFileSync(path.join(outputDir, file3RelativePath), 'utf-8')).toStrictEqual(file3Content);
    expect(fs.readFileSync(path.join(outputDir, file4RelativePath), 'utf-8')).toStrictEqual(file4Content);
  });

  it('should skip nested file', async () => {
    await extract(zipFilePath, {
      dir: outputDir,
      skipEntryPrefixes: [file4RelativePath],
    });
    expect(fs.existsSync(path.join(outputDir, dir1RelativePath))).toStrictEqual(true);
    expect(fs.existsSync(path.join(outputDir, dir2RelativePath))).toStrictEqual(true);
    expect(fs.readFileSync(path.join(outputDir, file1RelativePath), 'utf-8')).toStrictEqual(file1Content);
    expect(fs.readFileSync(path.join(outputDir, file2RelativePath), 'utf-8')).toStrictEqual(file2Content);
    expect(fs.readFileSync(path.join(outputDir, file3RelativePath), 'utf-8')).toStrictEqual(file3Content);
    expect(fs.existsSync(path.join(outputDir, file4RelativePath))).toStrictEqual(false);
  });

  it('should skip multiple entries', async () => {
    await extract(zipFilePath, {
      dir: outputDir,
      skipEntryPrefixes: [file1RelativePath, dir2RelativePath],
    });
    expect(fs.existsSync(path.join(outputDir, dir1RelativePath))).toStrictEqual(true);
    expect(fs.existsSync(path.join(outputDir, dir2RelativePath))).toStrictEqual(false);
    expect(fs.existsSync(path.join(outputDir, file1RelativePath))).toStrictEqual(false);
    expect(fs.readFileSync(path.join(outputDir, file2RelativePath), 'utf-8')).toStrictEqual(file2Content);
    expect(fs.readFileSync(path.join(outputDir, file3RelativePath), 'utf-8')).toStrictEqual(file3Content);
    expect(fs.existsSync(path.join(outputDir, file4RelativePath))).toStrictEqual(false);
  });
});
