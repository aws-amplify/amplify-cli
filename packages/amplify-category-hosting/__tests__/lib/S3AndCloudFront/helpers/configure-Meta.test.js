jest.mock('inquirer');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

const configureMeta = require('../../../../lib/S3AndCloudFront/helpers/configure-Meta');

describe('configure-Meta', () => {
  const DONE = 'exit';
  const configActions = {
    list: 'list',
    add: 'add',
    remove: 'remove',
    removeAll: 'remove all',
    done: DONE,
  };
  const mockContext = {
    amplify: {
      pathManager: {
        searchProjectRootPath: jest.fn(() => {
          return path.join(__dirname, '../../../../__mocks__/');
        }),
      },
      readJsonFile: jsonFilePath => {
        let content = fs.readFileSync(jsonFilePath, 'utf8');
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1);
        }
        return JSON.parse(content);
      },
    },
    print: {
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
    },
  };

  beforeAll(() => {
    fs.existsSync = jest.fn(() => {
      return true;
    });
    fs.writeFileSync = jest.fn();
  });

  beforeEach(() => {
    inquirer.prompt.mockClear();
    fs.existsSync.mockClear();
    fs.writeFileSync.mockClear();
  });

  test('configure, flow1', async () => {
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.list });
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.add });
    inquirer.prompt.mockResolvedValueOnce({ patternToAdd: 'mockPattern1', keyToAdd: 'mockKey1', valueToAdd: 'mockValue1' });
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.add });
    inquirer.prompt.mockResolvedValueOnce({ patternToAdd: 'mockPattern2', keyToAdd: 'mockKey2', valueToAdd: 'mockValue2' });
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.remove });
    inquirer.prompt.mockResolvedValueOnce({ patternToRemove: 'mockPattern1' });
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.done });
    const result = await configureMeta.configure(mockContext);
    expect(mockContext.print.info).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(Array.isArray(result)).toBeTruthy();
    console.log(result);
    expect(result).not.toContain('mockPattern1');
  });

  test('configure, flow2', async () => {
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.add });
    inquirer.prompt.mockResolvedValueOnce({ patternToAdd: 'mockPattern1' });
    inquirer.prompt.mockResolvedValueOnce({ keyToAdd: 'mockKey1' });
    inquirer.prompt.mockResolvedValueOnce({ valueToAdd: 'mockValue1' });

    inquirer.prompt.mockResolvedValueOnce({ action: configActions.add });
    inquirer.prompt.mockResolvedValueOnce({ patternToAdd: 'mockPattern2' });
    inquirer.prompt.mockResolvedValueOnce({ keyToAdd: 'mockKey2' });
    inquirer.prompt.mockResolvedValueOnce({ valueToAdd: 'mockValue2' });

    inquirer.prompt.mockResolvedValueOnce({ action: configActions.removeAll });
    inquirer.prompt.mockResolvedValueOnce({ action: configActions.done });
    const result = await configureMeta.configure(mockContext);
    expect(mockContext.print.info).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  test('getMeta', async () => {
    const actual = mockContext.amplify.readJsonFile(path.join(__dirname, '../../../../__mocks__/amplifyPublishMeta.json'));
    const result = await configureMeta.getMeta(mockContext);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toEqual(actual);
  });

  test('getMetaKeyValue', async () => {
    const result = configureMeta.getMetaKeyValue('dist/metaFile', [{ pattern: 'metaFile', key: 'testKey1', value: 'testValue1' }], 'dist');
    expect(result).toEqual([{ key: 'testKey1', value: 'testValue1' }]);
  });
});
