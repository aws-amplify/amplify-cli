import { determineServiceSelection } from '../../../../provider-utils/awscloudformation/utils/determineServiceSelection';
import { ServiceName } from '../../../../provider-utils/awscloudformation/utils/constants';

const serviceSelectionPromptMock = jest.fn();
const mockChooseServiceMessage = 'mockChooseServiceMessage';
const mockContext = {
  amplify: {
    getResourceStatus: async () => {
      return { allResources: [] };
    },
    serviceSelectionPrompt: serviceSelectionPromptMock,
  },
};

describe('determineServiceSelection', () => {
  it('returns LambdaFunction when no resources exists', async () => {
    const response = await determineServiceSelection(mockContext, mockChooseServiceMessage);
    expect(response.service === ServiceName.LambdaFunction);
    expect(serviceSelectionPromptMock).toBeCalledTimes(0);
  });

  it('returns LambdaFunction when only LambdaFunction resources exists', async () => {
    mockContext.amplify.getResourceStatus = async () => {
      return {
        allResources: [
          {
            service: ServiceName.LambdaFunction,
          },
        ],
      };
    };
    const response = await determineServiceSelection(mockContext, mockChooseServiceMessage);
    expect(response.service === ServiceName.LambdaFunction);
    expect(serviceSelectionPromptMock).toBeCalledTimes(0);
  });

  it('returns LambdaLayer when only LambdaLayer resources exists', async () => {
    mockContext.amplify.getResourceStatus = async () => {
      return {
        allResources: [
          {
            service: ServiceName.LambdaLayer,
          },
        ],
      };
    };
    const response = await determineServiceSelection(mockContext, mockChooseServiceMessage);
    expect(response.service === ServiceName.LambdaLayer);
    expect(serviceSelectionPromptMock).toBeCalledTimes(0);
  });

  it('returns LambdaLayer when existing LambdaFunction resources have mobileHubMigrated', async () => {
    mockContext.amplify.getResourceStatus = async () => {
      return {
        allResources: [
          {
            service: ServiceName.LambdaLayer,
          },
          {
            service: ServiceName.LambdaFunction,
            mobileHubMigrated: true,
          },
        ],
      };
    };
    const response = await determineServiceSelection(mockContext, mockChooseServiceMessage);
    expect(response.service === ServiceName.LambdaLayer);
    expect(serviceSelectionPromptMock).toBeCalledTimes(0);
  });

  it('prompts for user input when both LambdaFunction and LambdaLayer resources exist', async () => {
    mockContext.amplify.getResourceStatus = async () => {
      return {
        allResources: [
          {
            service: ServiceName.LambdaFunction,
          },
          {
            service: ServiceName.LambdaLayer,
          },
        ],
      };
    };
    await determineServiceSelection(mockContext, mockChooseServiceMessage);
    expect(serviceSelectionPromptMock).toBeCalledTimes(1);
  });
});
