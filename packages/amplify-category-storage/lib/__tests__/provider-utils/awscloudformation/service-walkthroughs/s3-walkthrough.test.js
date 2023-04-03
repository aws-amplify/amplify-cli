"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const uuid = __importStar(require("uuid"));
const s3_stack_transform_1 = require("../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform");
const s3_user_input_types_1 = require("../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types");
const s3AuthAPI = __importStar(require("../../../../provider-utils/awscloudformation/service-walkthroughs/s3-auth-api"));
const s3_questions_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/s3-questions");
const s3_user_input_state_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state");
const s3_walkthrough_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/s3-walkthrough");
jest.mock('amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state');
jest.mock('../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-auth-api');
jest.mock('uuid');
jest.mock('path');
jest.mock('fs-extra');
describe('add s3 walkthrough tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);
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
                getResourceStatus: () => {
                    return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
                },
                copyBatch: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                pathManager: {
                    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
                },
            },
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('addWalkthrough() simple-auth test', async () => {
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        jest.spyOn(s3AuthAPI, 'migrateAuthDependencyResource').mockReturnValue(new Promise((resolve, _reject) => {
            process.nextTick(() => resolve(true));
        }));
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockDataBuilder.getCLIInputs();
        amplify_prompts_1.prompter.input = jest
            .fn()
            .mockReturnValueOnce(S3MockDataBuilder.mockResourceName)
            .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName)
            .mockResolvedValueOnce(false);
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE]);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);
        let options = {};
        const returnedResourcename = await (0, s3_walkthrough_1.addWalkthrough)(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('addWalkthrough() simple-auth+guest test', async () => {
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockDataBuilder.addGuestAccess(undefined).getCLIInputs();
        amplify_prompts_1.prompter.input = jest
            .fn()
            .mockReturnValueOnce(S3MockDataBuilder.mockResourceName)
            .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName)
            .mockResolvedValueOnce(false);
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ]);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);
        let options = {};
        const returnedResourcename = await (0, s3_walkthrough_1.addWalkthrough)(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('addWalkthrough() simple-auth + trigger (new function) test', async () => {
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();
        amplify_prompts_1.prompter.input = jest
            .fn()
            .mockReturnValueOnce(S3MockDataBuilder.mockResourceName)
            .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName)
            .mockResolvedValueOnce(false);
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE]);
        amplify_prompts_1.prompter.yesOrNo = jest
            .fn()
            .mockReturnValueOnce(true)
            .mockResolvedValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);
        let options = {};
        const returnedResourcename = await (0, s3_walkthrough_1.addWalkthrough)(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('addWalkthrough() simple-auth + trigger (existing function) test', async () => {
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        mockContext.amplify.getResourceStatus = () => {
            return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
        };
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockDataBuilder
            .addMockTriggerFunction(S3MockDataBuilder.mockExistingFunctionName1)
            .getCLIInputs();
        amplify_prompts_1.prompter.input = jest
            .fn()
            .mockReturnValueOnce(S3MockDataBuilder.mockResourceName)
            .mockResolvedValueOnce(S3MockDataBuilder.mockBucketName)
            .mockResolvedValueOnce(false);
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE])
            .mockResolvedValueOnce(s3_user_input_types_1.S3TriggerFunctionType.EXISTING_FUNCTION)
            .mockResolvedValueOnce(S3MockDataBuilder.mockExistingFunctionName1);
        amplify_prompts_1.prompter.yesOrNo = jest
            .fn()
            .mockReturnValueOnce(true)
            .mockResolvedValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMeta);
        let options = {};
        const returnedResourcename = await (0, s3_walkthrough_1.addWalkthrough)(mockContext, S3MockDataBuilder.mockFilePath, mockContext, options);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
});
describe('update s3 permission walkthrough tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);
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
                getResourceStatus: () => {
                    return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
                },
                copyBatch: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                pathManager: {
                    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
                },
            },
            input: {
                options: {},
            },
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('updateWalkthrough() simple-auth + update auth-permission', async () => {
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder.removeAuthPermission(s3_user_input_types_1.S3PermissionType.DELETE).getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ]);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() simple-auth + update auth+guest permission', async () => {
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder
            .removeAuthPermission(s3_user_input_types_1.S3PermissionType.DELETE)
            .addGuestAccess([s3_user_input_types_1.S3PermissionType.READ])
            .getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.READ]);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() auth+guest + update remove guest permission ', async () => {
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder
            .removeMockTriggerFunction()
            .addGuestAccess(undefined)
            .getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder.removeGuestAccess().getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce(mockDataBuilder.defaultAuthPerms);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() simple-auth + update add group(individual) permission ', async () => {
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
        mockContext.amplify.getUserPoolGroupList = () => Object.keys(mockDataBuilder.mockGroupAccess);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder.removeAuthAccess().addGroupAccess().getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_questions_1.UserPermissionTypeOptions.INDIVIDUAL_GROUPS)
            .mockResolvedValueOnce(['mockAdminGroup', 'mockGuestGroup'])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.READ]);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('addWalkthrough() simple-auth + update add (both) group and auth+guest permission ', async () => {
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
        mockContext.amplify.getUserPoolGroupList = () => Object.keys(mockDataBuilder.mockGroupAccess);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder.addGuestAccess(undefined).addGroupAccess().getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_questions_1.UserPermissionTypeOptions.BOTH)
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ])
            .mockResolvedValueOnce(['mockAdminGroup', 'mockGuestGroup'])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE])
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.READ]);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
});
describe('update s3 lambda-trigger walkthrough tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);
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
                getResourceStatus: () => {
                    return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
                },
                copyBatch: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                pathManager: {
                    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
                },
            },
            input: {
                options: {},
            },
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('updateWalkthrough() simple auth + update add trigger ( new lambda)', async () => {
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([
            s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE,
            s3_user_input_types_1.S3PermissionType.READ,
            s3_user_input_types_1.S3PermissionType.DELETE,
        ]);
        amplify_prompts_1.prompter.confirmContinue = jest
            .fn()
            .mockReturnValueOnce(true)
            .mockResolvedValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() simple auth + new lambda + update remove trigger ', async () => {
        const existingDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockExpectedDataBuilder.removeMockTriggerFunction().getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([
            s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE,
            s3_user_input_types_1.S3PermissionType.READ,
            s3_user_input_types_1.S3PermissionType.DELETE,
        ])
            .mockResolvedValueOnce(s3_questions_1.S3CLITriggerUpdateMenuOptions.REMOVE);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() simple auth + new lambda + update change trigger (existing function)', async () => {
        mockContext.amplify.getResourceStatus = () => {
            return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
        };
        const existingDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockExpectedDataBuilder
            .addMockTriggerFunction(S3MockDataBuilder.mockExistingFunctionName1)
            .getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([
            s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE,
            s3_user_input_types_1.S3PermissionType.READ,
            s3_user_input_types_1.S3PermissionType.DELETE,
        ])
            .mockResolvedValueOnce(s3_questions_1.S3CLITriggerUpdateMenuOptions.UPDATE)
            .mockResolvedValueOnce(s3_user_input_types_1.S3TriggerFunctionType.EXISTING_FUNCTION)
            .mockResolvedValueOnce(S3MockDataBuilder.mockExistingFunctionName1);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() simple auth + new lambda + update change trigger (existing function)', async () => {
        mockContext.amplify.getResourceStatus = () => {
            return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
        };
        const existingDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(S3MockDataBuilder.mockExistingFunctionName1).getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockExpectedDataBuilder
            .addMockTriggerFunction(S3MockDataBuilder.mockFunctionName)
            .getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([
            s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE,
            s3_user_input_types_1.S3PermissionType.READ,
            s3_user_input_types_1.S3PermissionType.DELETE,
        ])
            .mockResolvedValueOnce(s3_questions_1.S3CLITriggerUpdateMenuOptions.UPDATE)
            .mockResolvedValueOnce(s3_user_input_types_1.S3TriggerFunctionType.NEW_FUNCTION);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockResolvedValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
    it('updateWalkthrough() simple auth + new lambda + update change trigger (new function)', async () => {
        mockContext.amplify.getResourceStatus = () => {
            return { allResources: S3MockDataBuilder.getMockGetAllResources2ExistingLambdas() };
        };
        const existingDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = existingDataBuilder.addMockTriggerFunction(undefined).getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const mockExpectedDataBuilder = new S3MockDataBuilder(undefined);
        const expectedCLIInputsJSON = mockExpectedDataBuilder
            .addMockTriggerFunction(S3MockDataBuilder.mockFunctioName2)
            .getCLIInputs();
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([
            s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE,
            s3_user_input_types_1.S3PermissionType.READ,
            s3_user_input_types_1.S3PermissionType.DELETE,
        ])
            .mockResolvedValueOnce(s3_questions_1.S3CLITriggerUpdateMenuOptions.UPDATE)
            .mockResolvedValueOnce(s3_user_input_types_1.S3TriggerFunctionType.NEW_FUNCTION);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockResolvedValueOnce(false);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda);
        jest.spyOn(uuid, 'v4').mockReturnValueOnce(S3MockDataBuilder.mockPolicyUUID2);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
});
describe('migrate s3 and update s3 permission walkthrough tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.spyOn(uuid, 'v4').mockReturnValue(S3MockDataBuilder.mockPolicyUUID);
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
                getResourceStatus: () => {
                    return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
                },
                copyBatch: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve, reject) => resolve(true))),
                pathManager: {
                    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
                },
            },
            input: {
                options: {},
            },
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('updateWalkthrough() simple-auth + migrate + update + auth-permission', async () => {
        const mockParamsJSON = getMigrationMockParametersJSON();
        const mockStorageParams = {};
        const mockCFN = {};
        const oldParams = {
            parametersFilepath: 'mockParamsfilePath',
            cfnFilepath: 'mockOldCFNFilepath',
            storageParamsFilepath: 'oldStorageParamsFilepath',
            parameters: mockParamsJSON,
            cfn: mockCFN,
            storageParams: mockStorageParams,
        };
        const mockDataBuilder = new S3MockDataBuilder(undefined);
        const currentCLIInputs = mockDataBuilder.removeMockTriggerFunction().getCLIInputs();
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'migrate');
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getOldS3ParamsForMigration').mockImplementation(() => oldParams);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => false);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getUserInput').mockImplementation(() => currentCLIInputs);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'saveCliInputPayload').mockImplementation(async () => {
            return;
        });
        jest.spyOn(s3_stack_transform_1.AmplifyS3ResourceStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = mockDataBuilder.removeAuthPermission(s3_user_input_types_1.S3PermissionType.DELETE).getCLIInputs();
        amplify_prompts_1.prompter.yesOrNo = jest
            .fn()
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockResolvedValueOnce(s3_user_input_types_1.S3AccessType.AUTH_ONLY)
            .mockResolvedValueOnce([s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ]);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough);
        const returnedResourcename = await (0, s3_walkthrough_1.updateWalkthrough)(mockContext);
        expect(returnedResourcename).toEqual(S3MockDataBuilder.mockResourceName);
        expect(s3_user_input_state_1.S3InputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
});
function getMigrationMockParametersJSON() {
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
class S3MockDataBuilder {
    constructor(startCliInputState) {
        this.mockGroupAccess = {
            mockAdminGroup: [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE],
            mockGuestGroup: [s3_user_input_types_1.S3PermissionType.READ],
        };
        this.defaultAuthPerms = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE];
        this.defaultGuestPerms = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ];
        this.simpleAuth = {
            resourceName: S3MockDataBuilder.mockResourceName,
            bucketName: S3MockDataBuilder.mockBucketName,
            policyUUID: S3MockDataBuilder.mockPolicyUUID,
            storageAccess: s3_user_input_types_1.S3AccessType.AUTH_ONLY,
            guestAccess: [],
            authAccess: this.defaultAuthPerms,
            groupAccess: {},
            triggerFunction: 'NONE',
        };
        this.cliInputs = {
            resourceName: undefined,
            bucketName: undefined,
            policyUUID: undefined,
            storageAccess: undefined,
            guestAccess: [],
            authAccess: [],
            triggerFunction: undefined,
            groupAccess: undefined,
        };
        if (startCliInputState) {
            this.cliInputs = startCliInputState;
        }
        else {
            Object.assign(this.cliInputs, this.simpleAuth);
        }
    }
    static getMockGetAllResources2ExistingLambdas() {
        return [
            { service: 'Cognito', serviceType: 'managed' },
            {
                service: amplify_cli_core_1.AmplifySupportedService.LAMBDA,
                resourceName: S3MockDataBuilder.mockExistingFunctionName1,
            },
            {
                service: amplify_cli_core_1.AmplifySupportedService.LAMBDA,
                resourceName: S3MockDataBuilder.mockExistingFunctionName2,
            },
        ];
    }
    static getMockGetAllResourcesNoExistingLambdas() {
        return [{ service: 'Cognito', serviceType: 'managed' }];
    }
    addGuestAccess(guestAccess) {
        this.cliInputs.storageAccess = s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST;
        if (guestAccess) {
            this.cliInputs.guestAccess = guestAccess;
        }
        else {
            this.cliInputs.guestAccess = this.defaultGuestPerms;
        }
        return this;
    }
    removeGuestAccess() {
        this.cliInputs.storageAccess = s3_user_input_types_1.S3AccessType.AUTH_ONLY;
        this.cliInputs.guestAccess = [];
        return this;
    }
    addMockTriggerFunction(customMockFunctionName) {
        if (customMockFunctionName) {
            this.cliInputs.triggerFunction = customMockFunctionName;
        }
        else {
            this.cliInputs.triggerFunction = S3MockDataBuilder.mockFunctionName;
        }
        return this;
    }
    removeMockTriggerFunction() {
        this.cliInputs.triggerFunction = undefined;
        return this;
    }
    removeAuthAccess() {
        this.cliInputs.authAccess = [];
        return this;
    }
    removeAuthPermission(permissionToBeRemoved) {
        const newPermissions = this.defaultAuthPerms.filter((permission) => permission !== permissionToBeRemoved);
        this.cliInputs.authAccess = newPermissions;
        return this;
    }
    addGroupAccess() {
        this.cliInputs.groupAccess = this.mockGroupAccess;
        return this;
    }
    removeGroupAccess() {
        this.cliInputs.groupAccess = undefined;
        return this;
    }
    getCLIInputs() {
        return this.cliInputs;
    }
}
S3MockDataBuilder.mockBucketName = 'mock-bucket-name-99';
S3MockDataBuilder.mockResourceName = 'mockResourceName';
S3MockDataBuilder.mockPolicyUUID = 'cafe2021';
S3MockDataBuilder.mockPolicyUUID2 = 'cafe2022';
S3MockDataBuilder.mockFunctionName = `S3Trigger${S3MockDataBuilder.mockPolicyUUID}`;
S3MockDataBuilder.mockFunctioName2 = `S3Trigger${S3MockDataBuilder.mockPolicyUUID2}`;
S3MockDataBuilder.mockExistingFunctionName1 = 'triggerHandlerFunction1';
S3MockDataBuilder.mockExistingFunctionName2 = 'triggerHandlerFunction2';
S3MockDataBuilder.mockFilePath = '';
S3MockDataBuilder.mockAuthMeta = {
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
S3MockDataBuilder.mockAmplifyMeta = {
    auth: {
        mockAuthName: S3MockDataBuilder.mockAuthMeta,
    },
};
S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthrough = {
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
S3MockDataBuilder.mockAmplifyMetaForUpdateWalkthroughLambda = {
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
//# sourceMappingURL=s3-walkthrough.test.js.map