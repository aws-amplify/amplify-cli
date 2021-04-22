import * as fs from 'fs-extra';
import * as path from 'path';
import { CFNTemplateFormat, JSONUtilities, readCFNTemplate, writeCFNTemplate } from '../../lib';

jest.mock('fs-extra');

const fs_mock = fs as jest.Mocked<typeof fs>;

fs_mock.existsSync.mockReturnValue(true);
fs_mock.statSync.mockReturnValue(({ isFile: true } as unknown) as fs.Stats);

const testPath = '/this/is/a/test/path.json';

const testTemplate = {
  test: 'content',
};

const jsonContent = JSONUtilities.stringify(testTemplate) as string;

const yamlContent = 'test: content\n';

type TwoArgReadFile = (p: string, e: string) => Promise<string>;

describe('readCFNTemplate', () => {
  beforeEach(() => jest.clearAllMocks());
  it('throws if specified file does not exist', async () => {
    fs_mock.existsSync.mockReturnValueOnce(false);
    await expect(readCFNTemplate(testPath)).rejects.toMatchInlineSnapshot(
      `[Error: No CloudFormation template found at /this/is/a/test/path.json]`,
    );
    fs_mock.existsSync.mockReturnValueOnce(true);
    fs_mock.statSync.mockReturnValueOnce(({ isFile: false } as unknown) as fs.Stats);
    await expect(readCFNTemplate(testPath)).rejects.toMatchInlineSnapshot(
      `[Error: No CloudFormation template found at /this/is/a/test/path.json]`,
    );
  });

  it('returns template with json format', async () => {
    ((fs_mock.readFile as unknown) as jest.MockedFunction<TwoArgReadFile>).mockResolvedValueOnce(jsonContent);
    const result = await readCFNTemplate(testPath);
    expect(result.templateFormat).toEqual(CFNTemplateFormat.JSON);
    expect(result.cfnTemplate).toEqual(testTemplate);
  });

  it('returns template with yaml format', async () => {
    ((fs_mock.readFile as unknown) as jest.MockedFunction<TwoArgReadFile>).mockResolvedValueOnce(yamlContent);
    const result = await readCFNTemplate(testPath);
    expect(result.templateFormat).toEqual(CFNTemplateFormat.YAML);
    expect(result.cfnTemplate).toEqual(testTemplate);
  });
});

describe('writeCFNTemplate', () => {
  beforeEach(() => jest.clearAllMocks());
  it('creates destination if it does not exist', async () => {
    await writeCFNTemplate(testTemplate, testPath);
    expect(fs_mock.ensureDir.mock.calls[0][0]).toEqual('/this/is/a/test');
  });

  it('writes json templates by default', async () => {
    await writeCFNTemplate(testTemplate, testPath);
    expect(fs_mock.writeFile.mock.calls[0][0]).toEqual(testPath);
    expect(fs_mock.writeFile.mock.calls[0][1]).toEqual(jsonContent);
  });

  it('writes yaml templates if specified', async () => {
    await writeCFNTemplate(testTemplate, testPath, { templateFormat: CFNTemplateFormat.YAML });
    expect(fs_mock.writeFile.mock.calls[0][0]).toEqual(testPath);
    expect(fs_mock.writeFile.mock.calls[0][1]).toEqual(yamlContent);
  });
});
