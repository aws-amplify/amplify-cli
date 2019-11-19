const configure = require('../../src/commands/configure');
const add = require('../../src/commands/add');
const loadConfig = require('../../src/codegen-config');
const configureProjectWalkThrough = require('../../src/walkthrough/configure');

jest.mock('../../src/commands/add');
jest.mock('../../src/codegen-config');
jest.mock('../../src/walkthrough/configure');

const MOCK_CONFIG_METHOD = {
  getProjects: jest.fn(),
  addProject: jest.fn(),
  save: jest.fn(),
};

const MOCK_CONFIG_WALK_THROUGH = 'MOCK_CONFIG_WALK_THROUGH';
const MOCK_APPSYNC_APIS = ['API1'];
const MOCK_CONTEXT = { amplify: { getProjectMeta: jest.fn() } };
describe('command - configure', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    loadConfig.mockReturnValue(MOCK_CONFIG_METHOD);
    MOCK_CONFIG_METHOD.getProjects.mockReturnValue(MOCK_APPSYNC_APIS);
    configureProjectWalkThrough.mockReturnValue(MOCK_CONFIG_WALK_THROUGH);
  });

  it('should update the configuration of project', async () => {
    await configure(MOCK_CONTEXT);
    expect(loadConfig).toHaveBeenCalledWith(MOCK_CONTEXT, false);
    expect(configureProjectWalkThrough).toHaveBeenCalledWith(MOCK_CONTEXT, MOCK_APPSYNC_APIS, false);
    expect(MOCK_CONFIG_METHOD.addProject).toHaveBeenCalledWith(MOCK_CONFIG_WALK_THROUGH);
    expect(MOCK_CONFIG_METHOD.save).toHaveBeenCalledWith();

    expect(add).not.toHaveBeenCalled();
  });

  it('should call add project when there are no App Sync API configured for codegen', async () => {
    MOCK_CONFIG_METHOD.getProjects.mockReturnValue([]);
    await configure(MOCK_CONTEXT);

    expect(configureProjectWalkThrough).not.toHaveBeenCalled();
    expect(MOCK_CONFIG_METHOD.addProject).not.toHaveBeenCalled();
    expect(MOCK_CONFIG_METHOD.save).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith(MOCK_CONTEXT);
  });
});
