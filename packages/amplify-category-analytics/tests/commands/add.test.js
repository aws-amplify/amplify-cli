const add = require('../../commands/analytics/add');

describe('analytics add: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const mockSelectionPrompt = jest.fn(() => Promise.resolve({service: 'Pinpoint' , providerName: 'awscloudformation'}));
  const mockSelectionPromptWithError = jest.fn(() => Promise.reject('Error'));

  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      serviceSelectionPrompt: mockSelectionPrompt,
      updateamplifyMetaAfterResourceAdd: jest.fn()
    },
    print: {
      warning: jest.fn().mockImplementation((info) => console.log(info)),
      info: jest.fn().mockImplementation((info) => console.log(info)),
      error: jest.fn().mockImplementation((info) => console.log(info)),
      success: jest.fn().mockImplementation((info) => console.log(info))
    },
  };


  it('unsuccessful analytics add with Cloudformation provider', async () => {
    jest.mock('../../provider-utils/awscloudformation/index', () => {
      return undefined;
    });
    await add.run(mockContext);
    expect(mockContext.print.error).toBeCalledWith('Provider not configured for this category');
  });


  it('successful analytics add with Cloudformation provider', async () => {
    jest.mock('../../provider-utils/awscloudformation/index', () => {
      return { addResource: () => Promise.resolve('analyticsresource') };
    });
    await add.run(mockContext);
    expect(add.run).toBeDefined();
    expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    expect(mockContext.amplify.updateamplifyMetaAfterResourceAdd).toBeCalled();
    expect(mockContext.print.success).toBeCalledWith('Successfully added resource analyticsresource locally');
  });

  it('error out amplify add', async () => {
    mockContext.amplify.serviceSelectionPrompt = mockSelectionPromptWithError;
    await add.run(mockContext);
    expect(mockContext.print.error).toBeCalledWith('There was an error adding the analytics resource');
  });

});

