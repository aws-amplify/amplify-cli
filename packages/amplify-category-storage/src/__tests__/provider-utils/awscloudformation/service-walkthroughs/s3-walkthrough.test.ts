import { $TSAny, $TSContext, AmplifySupportedService, stateManager } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import * as uuid from 'uuid';
import { AmplifyS3ResourceStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import {
  S3AccessType,
  S3PermissionType,
  S3TriggerFunctionType,
  S3UserInputs,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
import * as s3AuthAPI from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-auth-api';
import {
  S3CLITriggerUpdateMenuOptions,
  UserPermissionTypeOptions,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-questions';
import { MigrationParams, S3InputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state';
import { addWalkthrough, updateWalkthrough } from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-walkthrough';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state');
jest.mock('../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-auth-api');
jest.mock('uuid');
jest.mock('path');
jest.mock('fs-extra');

describe('add s3 walkthrough tests', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    //Mock: UUID generation
    jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);

    //Mock: Context/Amplify-Meta
    mockContext = {
      amplify: {
        getProjectDetails: () => {
          return {
            projectConfig: {
              projectName: 'mockProject',
            },
            amplifyMeta: {
              auth: S3MockDataBuilder.mockAuthMeta,
            },
          };
        },
        getUserPoolGroupList: () => {
          return [];
        },
        getResourceStatus: async () => {
          return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
        },
        copyBatch: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        pathManager: {
          getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
        },
      },
    } as unknown as $TSContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('addWalkthrough() simple-auth test', async () => {
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
    jest.spyOn(s3AuthAPI, 'migrateAuthDependencyResource').mockReturnValue(
      new Promise((resolve) => {
        process.nextTick(() => resolve(true));
      }),
    );

    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.getCLIInputs();

    //Simple Auth CLI walkthrough
    prompter.input = jest
      .fn()
      .mockReturnValueOnce(S3MockDataBuilder.mockResourceName) // Provide a friendly name
      .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName) // Provide bucket name
      .mockResolvedValueOnce(false); // Do you want to add Lambda Trigger

    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]); // What kind of permissions

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);

    const options = {};
    const returnedResourcename = await addWalkthrough(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);

    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
  it('addWalkthrough() simple-auth+guest test', async () => {
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.addGuestAccess(undefined).getCLIInputs();

    //Simple Auth CLI walkthrough
    prompter.input = jest
      .fn()
      .mockReturnValueOnce(S3MockDataBuilder.mockResourceName) // Provide a friendly name
      .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName) // Provide bucket name
      .mockResolvedValueOnce(false); // Do you want to add Lambda Trigger

    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_AND_GUEST) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]) // What kind of permissions (Auth)
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ]); // What kind of permissions (Guest)

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);

    const options = {};
    const returnedResourcename = await addWalkthrough(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);

    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
  it('addWalkthrough() simple-auth + trigger (new function) test', async () => {
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();

    //Simple Auth CLI walkthrough
    prompter.input = jest
      .fn()
      .mockReturnValueOnce(S3MockDataBuilder.mockResourceName) // Provide a friendly name
      .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName) // Provide bucket name
      .mockResolvedValueOnce(false);

    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]); // What kind of permissions (Auth)

    prompter.yesOrNo = jest
      .fn()
      .mockReturnValueOnce(true) //Do you want to add a Lambda Trigger ?
      .mockResolvedValueOnce(false); //Do you want to edit the lambda function now?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);

    const options = {};
    const returnedResourcename = await addWalkthrough(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);

    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
  it('addWalkthrough() simple-auth + trigger (existing function) test', async () => {
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
    //Add Existing Lambda functions in resource status
    mockContext.amplify.getResourceStatus = async () => {
      return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
    };

    const mockDataBuilder = new S3MockDataBuilder(undefined);
    //Select the first existing function from the list presented above in allResources
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder
      .addMockTriggerFunction(S3MockDataBuilder.mockExistingFunctionName1)
      .getCLIInputs();
    //Simple Auth CLI walkthrough
    prompter.input = jest
      .fn()
      .mockReturnValueOnce(S3MockDataBuilder.mockResourceName) // Provide a friendly name
      .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName) // Provide bucket name
      .mockResolvedValueOnce(false);

    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]) // What kind of permissions (Auth)
      .mockResolvedValueOnce(S3TriggerFunctionType.EXISTING_FUNCTION)
      .mockResolvedValueOnce(S3MockDataBuilder.mockExistingFunctionName1); //Selected the First Existing function from the list.

    prompter.yesOrNo = jest
      .fn()
      .mockReturnValueOnce(true) //Do you want to add a Lambda Trigger ?
      .mockResolvedValueOnce(false); //Do you want to edit the lambda function now?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);

    const options = {};
    const returnedResourcename = await addWalkthrough(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);

    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
});

describe('update s3 permission walkthrough tests', () => {
  let mockContext: $TSContext;
  beforeEach(() => {
    //Mock: UUID generation
    jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);

    //Mock: Context/Amplify-Meta
    mockContext = {
      amplify: {
        getUserPoolGroupList: () => [],
        getProjectDetails: () => {
          return {
            projectConfig: {
              projectName: 'mockProject',
            },
            amplifyMeta: {
              auth: S3MockDataBuilder.mockAuthMeta,
              storage: {
                [S3MockDataBuilder.mockResourceName]: {
                  service: 'S3',
                  providerPlugin: 'awscloudformation',
                  dependsOn: [],
                },
              },
            },
          };
        },
        // eslint-disable-next-line
        getResourceStatus: () => {
          return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
        }, //eslint-disable-line
        copyBatch: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        pathManager: {
          getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
        },
      },
      input: {
        options: {},
      },
    } as unknown as $TSContext;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  /**
   * Update Auth + Guest Tests
   */
  it('updateWalkthrough() simple-auth + update auth-permission', async () => {
    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set Auth permissions in Expected Output (without Delete permissions)
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.removeAuthPermission(S3PermissionType.DELETE).getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ]); /** Update Auth Permission in CLI */

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?
    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  it('updateWalkthrough() simple-auth + update auth+guest permission', async () => {
    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set Auth permissions in Expected Output (without Delete permissions)
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder
      .removeAuthPermission(S3PermissionType.DELETE)
      .addGuestAccess([S3PermissionType.READ])
      .getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_AND_GUEST) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ]) /** Update Auth Permission in CLI */
      .mockResolvedValueOnce([S3PermissionType.READ]); /** Update Guest Permission in CLI */

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?
    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  it('updateWalkthrough() auth+guest + update remove guest permission ', async () => {
    const mockDataBuilder = new S3MockDataBuilder(undefined);
    //start with auth+guest permissions
    const currentCLIInputs = mockDataBuilder
      .removeMockTriggerFunction()
      .addGuestAccess(undefined) //default guest access permissions
      .getCLIInputs();
    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set Auth permissions in Expected Output (without Delete permissions)
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.removeGuestAccess().getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce(mockDataBuilder.defaultAuthPerms); /** Update Auth Permission in CLI */

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?
    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  /**
   * Update Group Permission Checks
   */
  it('updateWalkthrough() simple-auth + update add group(individual) permission ', async () => {
    const mockDataBuilder = new S3MockDataBuilder(undefined);
    //start with simple auth permissions
    const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
    //Update Group list function in context
    mockContext.amplify.getUserPoolGroupList = () => Object.keys(mockDataBuilder.mockGroupAccess);

    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set Auth permissions in Expected Output (without Delete permissions)
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.removeAuthAccess().addGroupAccess().getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(UserPermissionTypeOptions.INDIVIDUAL_GROUPS) // Restrict Access By
      .mockResolvedValueOnce(['mockAdminGroup', 'mockGuestGroup']) //Select Groups
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]) //what kind of access do you want for the admin group
      .mockResolvedValueOnce([S3PermissionType.READ]); //what kind of access fo you want for the guest group

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?
    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
  it('addWalkthrough() simple-auth + update add (both) group and auth+guest permission ', async () => {
    const mockDataBuilder = new S3MockDataBuilder(undefined);
    //start with simple auth permissions
    const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
    //Update Group list function in context
    mockContext.amplify.getUserPoolGroupList = () => Object.keys(mockDataBuilder.mockGroupAccess);

    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //** Add GuestAccess, GroupAccess
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.addGuestAccess(undefined).addGroupAccess().getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(UserPermissionTypeOptions.BOTH) // Restrict Access By
      .mockResolvedValueOnce(S3AccessType.AUTH_AND_GUEST) // Restrict Access By
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]) //select Auth permissions
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ]) //select Guest permissions
      .mockResolvedValueOnce(['mockAdminGroup', 'mockGuestGroup']) //Select Groups
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE]) //select admin group permissions
      .mockResolvedValueOnce([S3PermissionType.READ]); //select guest group permissions

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?
    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
});

describe('update s3 lambda-trigger walkthrough tests', () => {
  let mockContext: $TSContext;
  beforeEach(() => {
    //Mock: UUID generation
    jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);

    //Mock: Context/Amplify-Meta
    mockContext = {
      amplify: {
        getUserPoolGroupList: () => [],
        getProjectDetails: () => {
          return {
            projectConfig: {
              projectName: 'mockProject',
            },
            amplifyMeta: {
              auth: S3MockDataBuilder.mockAuthMeta,
              storage: {
                [S3MockDataBuilder.mockResourceName]: {
                  service: 'S3',
                  providerPlugin: 'awscloudformation',
                  dependsOn: [],
                },
              },
            },
          };
        },
        // eslint-disable-next-line
        getResourceStatus: () => {
          return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
        }, //eslint-disable-line
        copyBatch: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        pathManager: {
          getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
        },
      },
      input: {
        options: {},
      },
    } as unknown as $TSContext;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  /**
   * Update Auth + Guest Tests
   */
  it('updateWalkthrough() simple auth + update add trigger ( new lambda)', async () => {
    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set Auth permissions in Expected Output (without Delete permissions)
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([
        S3PermissionType.CREATE_AND_UPDATE,
        S3PermissionType.READ,
        S3PermissionType.DELETE,
      ]); /** Update Auth Permission in CLI */

    prompter.confirmContinue = jest
      .fn()
      .mockReturnValueOnce(true) //Do you want to add a Lambda Trigger ?
      .mockResolvedValueOnce(false); //Do you want to edit the lambda function now?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  it('updateWalkthrough() simple auth + new lambda + update remove trigger ', async () => {
    //Given we have cliInputs with simple auth + Lambda trigger [ existingDataBuilder ]
    //When we use CLI to remove Lambda trigger.
    //Then we expect that the saveCliInputPayload is called with no Lambda trigger [ expectedCLIInputsJSON ]

    const existingDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();
    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set simple auth and remove triggerFunction
    const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockExpectedDataBuilder.removeMockTriggerFunction().getCLIInputs();

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([
        S3PermissionType.CREATE_AND_UPDATE,
        S3PermissionType.READ,
        S3PermissionType.DELETE,
      ]) /** Update Auth Permission in CLI */
      .mockResolvedValueOnce(S3CLITriggerUpdateMenuOptions.REMOVE); /** Select one of Update/Remove Skip*/

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  it('updateWalkthrough() simple auth + new lambda + update change trigger (existing function)', async () => {
    //Given we have auth with multiple existing functions
    //and cliInputs with simple auth + Lambda trigger [ existingDataBuilder ]
    //When we use CLI to change Lambda trigger with one of the existing functtions.
    //Then we expect that the saveCliInputPayload is called with the newly selected Lambda trigger [ expectedCLIInputsJSON ]

    //Add Existing Lambda functions in resource status
    mockContext.amplify.getResourceStatus = async () => {
      return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
    };

    const existingDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();

    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set simple-auth and set mockExistingFunctionName1 as the new trigger function
    const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockExpectedDataBuilder
      .addMockTriggerFunction(S3MockDataBuilder.mockExistingFunctionName1)
      .getCLIInputs();

    //Update CLI walkthrough (update trigger function with existing function)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([
        S3PermissionType.CREATE_AND_UPDATE,
        S3PermissionType.READ,
        S3PermissionType.DELETE,
      ]) /** Update Auth Permission in CLI */
      .mockResolvedValueOnce(S3CLITriggerUpdateMenuOptions.UPDATE) /** Select one of Update/Remove Skip*/
      .mockResolvedValueOnce(S3TriggerFunctionType.EXISTING_FUNCTION)
      .mockResolvedValueOnce(S3MockDataBuilder.mockExistingFunctionName1);

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);

    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  it('updateWalkthrough() simple auth + new lambda + update change trigger (existing function)', async () => {
    //Given we have auth with multiple existing functions
    //and cliInputs with simple auth + Lambda trigger (one of the existing trigger functions) [ existingDataBuilder ]
    //When we use CLI to change Lambda trigger with a new lambda function.
    //Then we expect that the saveCliInputPayload is called with the newly created lambda function trigger[ expectedCLIInputsJSON ]

    //Add Existing Lambda functions in resource status
    mockContext.amplify.getResourceStatus = async () => {
      return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
    };

    const existingDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(S3MockDataBuilder.mockExistingFunctionName1).getCLIInputs();

    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set simple-auth and set mockExistingFunctionName1 as the new trigger function
    const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockExpectedDataBuilder
      .addMockTriggerFunction(S3MockDataBuilder.mockFunctionName)
      .getCLIInputs();

    //Update CLI walkthrough (update trigger function with existing function)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([
        S3PermissionType.CREATE_AND_UPDATE,
        S3PermissionType.READ,
        S3PermissionType.DELETE,
      ]) /** Update Auth Permission in CLI */
      .mockResolvedValueOnce(S3CLITriggerUpdateMenuOptions.UPDATE) /** Select one of Update/Remove Skip*/
      .mockResolvedValueOnce(S3TriggerFunctionType.NEW_FUNCTION);

    //add new function
    prompter.confirmContinue = jest.fn().mockResolvedValueOnce(false); //Do you want to edit the lambda function now?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);

    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });

  it('updateWalkthrough() simple auth + new lambda + update change trigger (new function)', async () => {
    //Given we have auth with multiple existing functions
    //and cliInputs with simple auth + Lambda trigger (new trigger function) [ existingDataBuilder ]
    //When we use CLI to change Lambda trigger with a new lambda function.
    //Then we expect that the saveCliInputPayload is called with the newly created lambda function trigger[ expectedCLIInputsJSON ]

    //Add Existing Lambda functions in resource status
    mockContext.amplify.getResourceStatus = async () => {
      return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
    };

    const existingDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();

    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true); //CLI Input exists
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set simple-auth and set mockExistingFunctionName1 as the new trigger function
    const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
    const expectedCLIInputsJSON: S3UserInputs = mockExpectedDataBuilder
      .addMockTriggerFunction(S3MockDataBuilder.mockFunctioName2)
      .getCLIInputs();

    //Update CLI walkthrough (update trigger function with existing function)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([
        S3PermissionType.CREATE_AND_UPDATE,
        S3PermissionType.READ,
        S3PermissionType.DELETE,
      ]) /** Update Auth Permission in CLI */
      .mockResolvedValueOnce(S3CLITriggerUpdateMenuOptions.UPDATE) /** Select one of Update/Remove Skip*/
      .mockResolvedValueOnce(S3TriggerFunctionType.NEW_FUNCTION);

    //add new function
    prompter.confirmContinue = jest.fn().mockResolvedValueOnce(false); //Do you want to edit the lambda function now?

    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);

    //The newly generated function-name should use UUID2
    jest.spyOn(uuid, 'v4').mockReturnValueOnce(S3MockDataBuilder.mockPolicyUUID2);

    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
});

describe('migrate s3 and update s3 permission walkthrough tests', () => {
  let mockContext: $TSContext;
  beforeEach(() => {
    //Mock: UUID generation
    jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);

    //Mock: Context/Amplify-Meta
    mockContext = {
      amplify: {
        getUserPoolGroupList: () => [],
        getProjectDetails: () => {
          return {
            projectConfig: {
              projectName: 'mockProject',
            },
            amplifyMeta: {
              auth: S3MockDataBuilder.mockAuthMeta,
              storage: {
                [S3MockDataBuilder.mockResourceName]: {
                  service: 'S3',
                  providerPlugin: 'awscloudformation',
                  dependsOn: [],
                },
              },
            },
          };
        },
        getResourceStatus: async () => {
          return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
        },
        copyBatch: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        pathManager: {
          getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
        },
      },
      input: {
        options: {},
      },
    } as unknown as $TSContext;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Update + Migrate + Auth + Guest Tests
   */
  it('updateWalkthrough() simple-auth + migrate + update + auth-permission', async () => {
    const mockParamsJSON = getMigrationMockParametersJSON();
    const mockStorageParams = {}; //used only for userpools
    const mockCFN = {}; //currently not used

    const oldParams: MigrationParams = {
      parametersFilepath: 'mockParamsfilePath',
      cfnFilepath: 'mockOldCFNFilepath',
      storageParamsFilepath: 'oldStorageParamsFilepath',
      parameters: mockParamsJSON,
      cfn: mockCFN,
      storageParams: mockStorageParams,
    };

    const mockDataBuilder = new S3MockDataBuilder(undefined);
    const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
    jest.spyOn(S3InputState.prototype, 'migrate');
    jest.spyOn(S3InputState.prototype, 'getOldS3ParamsForMigration').mockImplementation(() => oldParams);
    jest.spyOn(S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => false); //CLI Input doesnt exist - requires migration
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs); //simple-auth
    jest.spyOn(S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
      return;
    });
    jest.spyOn(AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    //**Set Auth permissions in Expected Output (without Delete permissions)
    const expectedCLIInputsJSON: S3UserInputs = mockDataBuilder.removeAuthPermission(S3PermissionType.DELETE).getCLIInputs();

    prompter.yesOrNo = jest
      .fn()
      .mockReturnValueOnce(true) // Do you want to migrate...?
      .mockReturnValueOnce(false); // Do you want to add a Lambda Trigger ?

    //Update CLI walkthrough (update auth permission)
    prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(S3AccessType.AUTH_ONLY) // who should have access
      .mockResolvedValueOnce([S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ]); /** Update Auth Permission in CLI */

    //
    stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
    const returnedResourcename = await updateWalkthrough(mockContext);
    expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
    expect(S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
});

function getMigrationMockParametersJSON(): $TSAny {
  const mockParametersJSON = {
    bucketName: 'migratefix2c53c1f2a55574207949d2bb7a88258a4',
    authPolicyName: 's3_amplify_81ce520f',
    unauthPolicyName: 's3_amplify_81ce520f',
    authRoleName: {
      Ref: 'AuthRoleName',
    },
    unauthRoleName: {
      Ref: 'UnauthRoleName',
    },
    selectedGuestPermissions: ['s3:GetObject', 's3:ListBucket'],
    selectedAuthenticatedPermissions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
    s3PermissionsAuthenticatedPublic: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PublicPolicy: 'Public_policy_217e732f',
    s3PermissionsAuthenticatedUploads: 's3:PutObject',
    s3UploadsPolicy: 'Uploads_policy_217e732f',
    s3PermissionsAuthenticatedProtected: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3ProtectedPolicy: 'Protected_policy_217e732f',
    s3PermissionsAuthenticatedPrivate: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PrivatePolicy: 'Private_policy_217e732f',
    AuthenticatedAllowList: 'ALLOW',
    s3ReadPolicy: 'read_policy_217e732f',
    s3PermissionsGuestPublic: 'DISALLOW',
    s3PermissionsGuestUploads: 'DISALLOW',
    GuestAllowList: 'DISALLOW',
    triggerFunction: 'NONE',
  };

  return mockParametersJSON;
}

//Helper class to start with Simple Auth and mutate the CLI Inputs based on Test-Case
class S3MockDataBuilder {
  static mockBucketName = 'mock-bucket-name-99'; //s3 bucket naming rules allows alphanumeric and hyphens
  static mockResourceName = 'mockResourceName';
  static mockPolicyUUID = 'cafe2021';
  static mockPolicyUUID2 = 'cafe2022';
  static mockFunctionName = `S3Trigger${S3MockDataBuilder.mockPolicyUUID}`;
  static mockFunctioName2 = `S3Trigger${S3MockDataBuilder.mockPolicyUUID2}`;
  static mockExistingFunctionName1 = 'triggerHandlerFunction1';
  static mockExistingFunctionName2 = 'triggerHandlerFunction2';
  static mockFilePath = '';
  static mockAuthMeta = {
    service: 'Cognito',
    providerPlugin: 'awscloudformation',
    dependsOn: [],
    customAuth: false,
    frontendAuthConfig: {
      loginMechanisms: ['PREFERRED_USERNAME'],
      signupAttributes: ['EMAIL'],
      passwordProtectionSettings: {
        passwordPolicyMinLength: 8,
        passwordPolicyCharacters: [],
      },
      mfaConfiguration: 'OFF',
      mfaTypes: ['SMS'],
      verificationMechanisms: ['EMAIL'],
    },
  };
  static mockAmplifyMeta = {
    auth: {
      mockAuthName: S3MockDataBuilder.mockAuthMeta,
    },
  };
  static mockAmplifyMetaForUpdateWalkthrough = {
    auth: {
      mockAuthName: S3MockDataBuilder.mockAuthMeta,
    },
    storage: {
      [S3MockDataBuilder.mockResourceName]: {
        service: 'S3',
        providerPlugin: 'awscloudformation',
        dependsOn: [],
      },
    },
  };

  static mockAmplifyMetaForUpdateWalkthroughLambda = {
    auth: {
      mockAuthName: S3MockDataBuilder.mockAuthMeta,
    },
    storage: {
      [S3MockDataBuilder.mockResourceName]: {
        service: 'S3',
        providerPlugin: 'awscloudformation',
        dependsOn: [
          {
            category: 'function',
            resourceName: S3MockDataBuilder.mockFunctionName,
            attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
          },
        ],
      },
    },
  };

  mockGroupAccess = {
    mockAdminGroup: [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE],
    mockGuestGroup: [S3PermissionType.READ],
  };
  defaultAuthPerms = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE];
  defaultGuestPerms = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ];

  simpleAuth: S3UserInputs = {
    resourceName: S3MockDataBuilder.mockResourceName,
    bucketName: S3MockDataBuilder.mockBucketName,
    policyUUID: S3MockDataBuilder.mockPolicyUUID,
    storageAccess: S3AccessType.AUTH_ONLY,
    guestAccess: [],
    authAccess: this.defaultAuthPerms,
    groupAccess: {},
    triggerFunction: 'NONE',
  };
  cliInputs: S3UserInputs = {
    resourceName: undefined,
    bucketName: undefined,
    policyUUID: undefined,
    storageAccess: undefined,
    guestAccess: [],
    authAccess: [],
    triggerFunction: undefined,
    groupAccess: undefined,
  };

  constructor(startCliInputState: S3UserInputs | undefined) {
    if (startCliInputState) {
      this.cliInputs = startCliInputState;
    } else {
      Object.assign(this.cliInputs, this.simpleAuth);
    }
  }

  static getMockGetAllResources2ExistingLambdas() {
    return [
      { service: 'Cognito', serviceType: 'managed' },

      {
        service: AmplifySupportedService.LAMBDA,
        resourceName: S3MockDataBuilder.mockExistingFunctionName1,
      },
      {
        service: AmplifySupportedService.LAMBDA,
        resourceName: S3MockDataBuilder.mockExistingFunctionName2,
      },
    ];
  }
  static getMockGetAllResourcesNoExistingLambdas() {
    return [{ service: 'Cognito', serviceType: 'managed' }];
  }

  addGuestAccess(guestAccess: Array<S3PermissionType> | undefined): S3MockDataBuilder {
    this.cliInputs.storageAccess = S3AccessType.AUTH_AND_GUEST;
    if (guestAccess) {
      this.cliInputs.guestAccess = guestAccess;
    } else {
      this.cliInputs.guestAccess = this.defaultGuestPerms;
    }
    return this;
  }

  removeGuestAccess(): S3MockDataBuilder {
    this.cliInputs.storageAccess = S3AccessType.AUTH_ONLY;
    this.cliInputs.guestAccess = [];
    return this;
  }

  addMockTriggerFunction(customMockFunctionName: string | undefined): S3MockDataBuilder {
    if (customMockFunctionName) {
      this.cliInputs.triggerFunction = customMockFunctionName;
    } else {
      this.cliInputs.triggerFunction = S3MockDataBuilder.mockFunctionName;
    }
    return this;
  }

  removeMockTriggerFunction(): S3MockDataBuilder {
    this.cliInputs.triggerFunction = undefined;
    return this;
  }

  removeAuthAccess(): S3MockDataBuilder {
    this.cliInputs.authAccess = [];
    return this;
  }

  removeAuthPermission(permissionToBeRemoved: S3PermissionType): S3MockDataBuilder {
    const newPermissions = this.defaultAuthPerms.filter((permission) => permission !== permissionToBeRemoved);
    this.cliInputs.authAccess = newPermissions;
    return this;
  }

  addGroupAccess(): S3MockDataBuilder {
    this.cliInputs.groupAccess = this.mockGroupAccess;
    return this;
  }

  removeGroupAccess(): S3MockDataBuilder {
    this.cliInputs.groupAccess = undefined;
    return this;
  }

  getCLIInputs(): S3UserInputs {
    return this.cliInputs;
  }
}
