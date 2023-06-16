const fs = require('fs-extra');
const path = require('path');
const configurePublish = require('../../../../lib/S3AndCloudFront/helpers/configure-Publish');
const amplifyPrompts = require('@aws-amplify/amplify-prompts');

jest.mock('@aws-amplify/amplify-prompts', () => ({
  prompter: {
    input: jest.fn(),
    yesOrNo: jest.fn(),
    pick: jest.fn(),
  },
  byValue: jest.fn(),
}));

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
      readJsonFile: (jsonFilePath) => {
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
    amplifyPrompts.byValue.mockResolvedValueOnce('list');
    amplifyPrompts.prompter.pick
      .mockResolvedValueOnce(configActions.list)
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.remove)
      .mockResolvedValueOnce('mockPattern1')
      .mockResolvedValueOnce(configActions.done);

    amplifyPrompts.prompter.input.mockResolvedValueOnce('mockPattern1').mockResolvedValueOnce('mockPattern2');

    const result = await configurePublish.configure(mockContext);
    expect(mockContext.print.info).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).not.toContain('mockPattern1');
    expect(result).toContain('mockPattern2');
  });

  test('configure, flow2', async () => {
    amplifyPrompts.byValue.mockResolvedValueOnce('list');
    amplifyPrompts.prompter.pick
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(configActions.removeAll)
      .mockResolvedValueOnce(configActions.done);

    amplifyPrompts.prompter.input.mockResolvedValueOnce('mockPattern1').mockResolvedValueOnce('mockPattern2');

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
