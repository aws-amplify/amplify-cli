const loadConfig = require('../../src/codegen-config');
const askShouldUpdateCode = require('../../src/walkthrough/questions/updateCode');
const askShouldUpdateStatements = require('../../src/walkthrough/questions/updateDocs');

const prePushUpdateCallback = require('../../src/callbacks/prePushUpdateCallback');

const MOCK_CONTEXT = {
  exeInfo: {},
  print: {
    info: jest.fn(),
  },
};

jest.mock('../../src/codegen-config');
jest.mock('../../src/walkthrough/questions/updateCode');
jest.mock('../../src/walkthrough/questions/updateDocs');

const MOCK_PROJECT_NAME = 'MOCK_PROJECT';
const MOCK_SELECTED_PROJECT = { projectName: MOCK_PROJECT_NAME, foo: 'bar' };
const MOCK_PROJECTS = [MOCK_SELECTED_PROJECT];

const LOAD_CONFIG_METHODS = {
  getProjects: jest.fn(),
  addProject: jest.fn(),
  save: jest.fn(),
};

describe('callback - prepushUpdate AppSync API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    loadConfig.mockReturnValue(LOAD_CONFIG_METHODS);
    LOAD_CONFIG_METHODS.getProjects.mockReturnValue(MOCK_PROJECTS);
    askShouldUpdateCode.mockReturnValue(true);
    askShouldUpdateStatements.mockReturnValue(true);
  });

  it('should ask prompt user to update statements and types', async () => {
    const result = await prePushUpdateCallback(MOCK_CONTEXT, MOCK_PROJECT_NAME);
    expect(result.gqlConfig).toEqual(MOCK_SELECTED_PROJECT);
    expect(result.shouldGenerateDocs).toEqual(true);
  });

  it('should not return anything if the user declines updating code', async () => {
    askShouldUpdateCode.mockReturnValue(false);
    const result = await prePushUpdateCallback(MOCK_CONTEXT, MOCK_PROJECT_NAME);
    expect(result).toBeUndefined();
  });

  it('should set shouldGenerateDocs when user declines statement generation', async () => {
    askShouldUpdateStatements.mockReturnValue(false);
    const result = await prePushUpdateCallback(MOCK_CONTEXT, MOCK_PROJECT_NAME);
    expect(result.shouldGenerateDocs).toEqual(false);
  });
});
