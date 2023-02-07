import { prompter } from 'amplify-prompts';
import { $TSContext, pathManager } from 'amplify-cli-core';
import { topLevelCommentPrefix, topLevelCommentSuffix, envVarPrintoutPrefix } from '../../../../constants';
import { ServiceName } from '../../../../../src/provider-utils/awscloudformation/utils/constants';
import * as envVarHelper from '../../../../../src/provider-utils/awscloudformation/utils/environmentVariablesHelper';
import {
  buildTopLevelComment,
  buildShowEnvVars,
  updateWalkthrough,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/lambda-walkthrough';

jest.mock('amplify-prompts');
jest.mock('amplify-cli-core');
jest.mock('../../../../../src/provider-utils/awscloudformation/utils/environmentVariablesHelper');

describe('Lambda Walkthrough : Advanced options and Environment Vars ', () => {
  test('buildTopLevelComment should insert all environment variables in top-level-comment (example code header)', () => {
    const inputEnvMap: Record<string, any> = {
      ENV: {
        Ref: 'env',
      },
      REGION: {
        Ref: 'AWS::Region',
      },
      STORAGE_MOCK_BUCKETNAME: {
        Ref: 'storageMockBucketName',
      },
      SES_EMAIL: {
        Ref: 'sesEmail',
      },
    };
    const outputString = `${topLevelCommentPrefix}ENV\n\tREGION\n\tSTORAGE_MOCK_BUCKETNAME\n\tSES_EMAIL${topLevelCommentSuffix}`;
    expect(buildTopLevelComment(inputEnvMap)).toEqual(outputString);
  });

  test('buildShowEnvVars should insert all environment variables to be displayed', () => {
    const inputEnvMap: Record<string, any> = {
      ENV: {
        Ref: 'env',
      },
      REGION: {
        Ref: 'AWS::Region',
      },
      STORAGE_MOCK_BUCKETNAME: {
        Ref: 'storageMockBucketName',
      },
      SES_EMAIL: {
        Ref: 'sesEmail',
      },
    };
    const outputString = `${envVarPrintoutPrefix}ENV\n\tREGION\n\tSTORAGE_MOCK_BUCKETNAME\n\tSES_EMAIL`;
    expect(buildShowEnvVars(inputEnvMap)).toEqual(outputString);
  });
});

describe('updateWalkthrough', () => {
  const prompterMock = prompter as jest.Mocked<typeof prompter>;
  const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
  const spyOnGetStoredEnvironmentVariables = jest.spyOn(envVarHelper, 'getStoredEnvironmentVariables');

  const existingResourceName = 'test_existingLambdaResourceName';
  const existingResource = {
    service: ServiceName.LambdaFunction,
    mobileHubMigrated: false,
    resourceName: existingResourceName,
  };

  beforeAll(() => {
    pathManagerMock.getBackendDirPath.mockReset();
    pathManagerMock.getBackendDirPath.mockReturnValue('');
    spyOnGetStoredEnvironmentVariables.mockReset();
    spyOnGetStoredEnvironmentVariables.mockReturnValue({});
  });

  beforeEach(() => {
    prompterMock.input.mockReset();
  });

  afterAll(() => {
    prompterMock.input.mockReset();
  });

  it('does not prompt if there are no Lambda resource names', async () => {
    const contextMock = ({
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValueOnce({
          allResources: [],
        }),
      },
    } as unknown) as jest.Mocked<$TSContext>;

    await updateWalkthrough(contextMock, undefined);

    expect(prompterMock.pick).not.toBeCalled();
  });

  it('does not prompt if there are Lambda resource names but none are matched by specified resource', async () => {
    const resourceName = 'testLambaName';
    const contextMock = ({
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValueOnce({
          allResources: [existingResource],
        }),
      },
    } as unknown) as jest.Mocked<$TSContext>;

    await updateWalkthrough(contextMock, resourceName);

    expect(prompterMock.pick).not.toBeCalled();
  });

  it('does prompt if there are Lambda resource names and no resource name is provided', async () => {
    const contextMock = ({
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValueOnce({
          allResources: [existingResource],
        }),
        readBreadcrumbs: jest.fn().mockResolvedValueOnce({
          functionRuntime: '',
        }),
      },
      print: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
      },
    } as unknown) as jest.Mocked<$TSContext>;
    prompterMock.pick.mockResolvedValueOnce(existingResourceName);

    await updateWalkthrough(contextMock, undefined);

    expect(prompterMock.pick).toHaveBeenCalledTimes(2);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(1, 'Select the Lambda function you want to update', [existingResourceName]);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(2, 'Which setting do you want to update?', expect.anything());
  });
});
