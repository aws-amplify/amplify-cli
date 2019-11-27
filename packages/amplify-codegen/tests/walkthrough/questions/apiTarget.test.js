const inquirer = require('inquirer');

const askAppSyncAPITarget = require('../../../src/walkthrough/questions/apiTarget');

jest.mock('inquirer');

describe('askAppSyncAPITarget', () => {
  const mockContext = 'MOCK_CONTEXT';
  const selectedAPI = 'appsync-selected-api';
  const appSyncAPIs = [
    { name: 'api1', id: selectedAPI },
    { name: 'api2', id: 'non-selected-api' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    inquirer.prompt.mockReturnValue({ apiId: selectedAPI });
  });

  it('should show a list of APIs', async () => {
    const api = await askAppSyncAPITarget(mockContext, appSyncAPIs, selectedAPI);
    expect(api).toEqual(selectedAPI);
    const promptParams = inquirer.prompt.mock.calls[0][0];
    const expectedChoices = appSyncAPIs.map(a => ({ name: a.name, value: a.id }));
    expect(promptParams[0].choices).toEqual(expectedChoices);
    expect(promptParams[0].type).toEqual('list');
  });

  it('should not prompt if there is only one API available', async () => {
    const api = await askAppSyncAPITarget(mockContext, [appSyncAPIs[0]], selectedAPI);
    expect(api).toEqual(appSyncAPIs[0].id);
    expect(inquirer.prompt).not.toHaveBeenCalled();
  });

  it('should use the selected API as default value for choice', async () => {
    await askAppSyncAPITarget(mockContext, appSyncAPIs, selectedAPI);
    const promptParams = inquirer.prompt.mock.calls[0][0];
    expect(promptParams[0].default).toEqual(selectedAPI);
  });
});
