const fs = require('fs-extra');
const path = require('path');
const configurePublish = require('../../../../lib/S3AndCloudFront/helpers/configure-Publish');

const prompter = require('amplify-prompts');
jest.mock('amplify-prompts');

describe('configure-Publish', () => {
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
    fs.existsSync.mockClear();
    fs.writeFileSync.mockClear();
  });

  test('configure, flow1', async () => {
    prompter.pick = jest.fn
      .mockResolvedValueOnce(configActions.list)
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.remove)
      .mockResolvedValueOnce(configActions.done);

    prompter.input = jest.fn
      .mockResolvedValueOnce('mockPattern1')
      .mockResolvedValueOnce('mockPattern2')
      .mockResolvedValueOnce('mockPattern1');

    const result = await configurePublish.configure(mockContext);
    expect(mockContext.print.info).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).not.toContain('mockPattern1');
    expect(result).toContain('mockPattern2');
  });

  test('configure, flow2', async () => {
    prompter.pick = jest.fn
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.removeAll)
      .mockResolvedValueOnce(configActions.done);

    prompter.input = jest.fn
      .mockResolvedValueOnce('mockPattern1')
      .mockResolvedValueOnce('mockPattern2');

    const result = await configurePublish.configure(mockContext);
    expect(mockContext.print.info).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  test('getIgnore', async () => {
    const actual = mockContext.amplify.readJsonFile(path.join(__dirname, '../../../../__mocks__/amplifyPublishIgnore.json'));
    const result = await configurePublish.getIgnore(mockContext);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toEqual(actual);
  });

  test('isIgnored', async () => {
    const result = configurePublish.isIgnored('dist/ignoredFile', ['ignoredFile'], 'dist');
    expect(typeof result).toEqual('boolean');
    expect(result).toEqual(true);
  });
});
