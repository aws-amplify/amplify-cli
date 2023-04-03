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
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const glob_1 = require("glob");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const cdk = __importStar(require("aws-cdk-lib"));
const dependency_management_utils_1 = require("../../utils/dependency-management-utils");
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('glob');
jest.mock('fs-extra');
const readCFNTemplate_mock = amplify_cli_core_1.readCFNTemplate;
const writeCFNTemplate_mock = amplify_cli_core_1.writeCFNTemplate;
writeCFNTemplate_mock.mockResolvedValue();
const glob_mock = glob_1.glob;
const fs_mock = fs;
amplify_cli_core_1.pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');
amplify_cli_core_1.pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue('mockResourceDir');
describe('getResourceCfnOutputAttributes() scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
                copyBatch: jest.fn(),
                getResourceStatus: jest.fn().mockResolvedValue({
                    allResources: [
                        {
                            resourceName: 'mockresource1',
                            service: 'customCDK',
                        },
                        {
                            resourceName: 'mockresource2',
                            service: 'customCDK',
                        },
                    ],
                }),
            },
        };
    });
    it('get resource attr for resources with build folder with one cfn file', async () => {
        fs_mock.existsSync.mockReturnValue(true);
        readCFNTemplate_mock.mockReturnValueOnce({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValueOnce(['mockFileName']);
        expect((0, dependency_management_utils_1.getResourceCfnOutputAttributes)('mockCategory', 'mockResourceName')).toEqual(['mockKey']);
    });
    it('get resource attr for resources with build folder with multiple cfn files', async () => {
        fs_mock.existsSync.mockReturnValue(true);
        readCFNTemplate_mock.mockReturnValueOnce({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValueOnce(['mockFileName1', 'mockFileName2']);
        expect((0, dependency_management_utils_1.getResourceCfnOutputAttributes)('mockCategory', 'mockResourceName')).toEqual([]);
    });
    it('get resource attr for resources without build folder', async () => {
        fs_mock.existsSync.mockReturnValue(false);
        readCFNTemplate_mock.mockReturnValueOnce({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValueOnce(['mockFileName']);
        expect((0, dependency_management_utils_1.getResourceCfnOutputAttributes)('mockCategory', 'mockResourceName')).toEqual(['mockKey']);
    });
    it('get resource attr for resources without build folder with multiple cfn files', async () => {
        fs_mock.existsSync.mockReturnValue(false);
        readCFNTemplate_mock.mockReturnValueOnce({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValueOnce(['mockFileName1', 'mockFileName2']);
        expect((0, dependency_management_utils_1.getResourceCfnOutputAttributes)('mockCategory', 'mockResourceName')).toEqual([]);
    });
    it('get resource attr for resources without any cfn files', async () => {
        fs_mock.existsSync.mockReturnValue(false);
        glob_mock.sync.mockReturnValueOnce([]);
        expect((0, dependency_management_utils_1.getResourceCfnOutputAttributes)('mockCategory', 'mockResourceName')).toEqual([]);
    });
});
describe('getAllResources() scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
                copyBatch: jest.fn(),
                getResourceStatus: jest.fn().mockResolvedValue({
                    allResources: [
                        {
                            resourceName: 'mockresource1',
                            service: 'customCDK',
                        },
                        {
                            resourceName: 'mockresource2',
                            service: 'customCDK',
                        },
                    ],
                }),
            },
        };
    });
    it('get all resource types', async () => {
        fs_mock.existsSync.mockReturnValue(false);
        readCFNTemplate_mock.mockReturnValue({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValue(['mockFileName']);
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue({
            mockCategory1: {
                mockResourceName1: {},
            },
            mockCategory2: {
                mockResourceName2: {},
            },
        });
        expect((0, dependency_management_utils_1.getAllResources)()).toEqual({
            mockCategory1: { mockResourceName1: { mockKey: 'string' } },
            mockCategory2: { mockResourceName2: { mockKey: 'string' } },
        });
    });
});
describe('addCDKResourceDependency() scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
                copyBatch: jest.fn(),
                getResourceStatus: jest.fn().mockResolvedValue({
                    allResources: [
                        {
                            resourceName: 'mockresource1',
                            service: 'customCDK',
                        },
                        {
                            resourceName: 'mockresource2',
                            service: 'customCDK',
                        },
                    ],
                }),
            },
        };
    });
    it('get depenencies for a custom CDK stack', async () => {
        fs_mock.existsSync.mockReturnValue(false);
        readCFNTemplate_mock.mockReturnValue({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValue(['mockFileName']);
        const mockBackendConfig = {
            mockCategory1: {
                mockResourceName1: {},
            },
            mockCategory2: {
                mockResourceName2: {},
            },
            mockCategory3: {
                mockResourceName3: {},
            },
            mockCategory4: {
                mockResourceName4: {},
            },
        };
        amplify_cli_core_1.stateManager.getBackendConfig = jest.fn().mockReturnValue(mockBackendConfig);
        amplify_cli_core_1.stateManager.setBackendConfig = jest.fn();
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockBackendConfig);
        amplify_cli_core_1.stateManager.setMeta = jest.fn();
        const mockStack = new cdk.Stack();
        let retVal = (0, dependency_management_utils_1.addCDKResourceDependency)(mockStack, 'mockCategory1', 'mockResourceName1', [
            { category: 'mockCategory2', resourceName: 'mockResourceName2' },
        ]);
        expect(retVal).toEqual({
            mockCategory2: {
                mockResourceName2: { mockKey: 'mockCategory2mockResourceName2mockKey' },
            },
        });
        const postUpdateBackendConfig = mockBackendConfig;
        postUpdateBackendConfig.mockCategory1.mockResourceName1.dependsOn = [
            {
                attributes: ['mockKey'],
                category: 'mockCategory2',
                resourceName: 'mockResourceName2',
            },
        ];
        expect(amplify_cli_core_1.stateManager.setMeta).toBeCalledWith(undefined, postUpdateBackendConfig);
        expect(amplify_cli_core_1.stateManager.setBackendConfig).toBeCalledWith(undefined, postUpdateBackendConfig);
        retVal = (0, dependency_management_utils_1.addCDKResourceDependency)(mockStack, 'mockCategory1', 'mockResourceName1', [
            { category: 'mockCategory4', resourceName: 'mockResourceName4' },
            { category: 'mockCategory3', resourceName: 'mockResourceName3' },
        ]);
        expect(retVal).toEqual({
            mockCategory4: {
                mockResourceName4: { mockKey: 'mockCategory4mockResourceName4mockKey' },
            },
            mockCategory3: {
                mockResourceName3: { mockKey: 'mockCategory3mockResourceName3mockKey' },
            },
        });
        postUpdateBackendConfig.mockCategory1.mockResourceName1.dependsOn = [
            {
                attributes: ['mockKey'],
                category: 'mockCategory3',
                resourceName: 'mockResourceName3',
            },
            {
                attributes: ['mockKey'],
                category: 'mockCategory4',
                resourceName: 'mockResourceName4',
            },
        ];
        expect(amplify_cli_core_1.stateManager.setMeta).toBeCalledWith(undefined, postUpdateBackendConfig);
        expect(amplify_cli_core_1.stateManager.setBackendConfig).toBeCalledWith(undefined, postUpdateBackendConfig);
        readCFNTemplate_mock.mockReturnValue({ templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON, cfnTemplate: {} });
        retVal = (0, dependency_management_utils_1.addCDKResourceDependency)(mockStack, 'mockCategory1', 'mockResourceName1', [
            { category: 'mockCategory4', resourceName: 'mockResourceName4' },
            { category: 'mockCategory3', resourceName: 'mockResourceName3' },
        ]);
        expect(retVal).toEqual({});
        expect(amplify_cli_core_1.stateManager.setMeta).toBeCalledTimes(2);
        expect(amplify_cli_core_1.stateManager.setBackendConfig).toBeCalledTimes(2);
    });
});
describe('addCFNResourceDependency() scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
                copyBatch: jest.fn(),
                updateamplifyMetaAfterResourceUpdate: jest.fn(),
                getResourceStatus: jest.fn().mockResolvedValue({
                    allResources: [
                        {
                            resourceName: 'mockresource1',
                            service: 'customCDK',
                        },
                        {
                            resourceName: 'mockresource2',
                            service: 'customCDK',
                        },
                    ],
                }),
            },
        };
    });
    it('add new resource dependency to custom cfn stack', async () => {
        amplify_prompts_1.prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);
        fs_mock.existsSync.mockReturnValue(false);
        readCFNTemplate_mock.mockReturnValue({
            templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
        });
        glob_mock.sync.mockReturnValue(['mockFileName']);
        const mockBackendConfig = {
            mockCategory1: {
                mockResourceName1: {},
            },
            mockCategory2: {
                mockResourceName2: {},
            },
            mockCategory3: {
                mockResourceName3: {},
            },
            custom: {
                customResourcename: {},
            },
        };
        amplify_cli_core_1.stateManager.getBackendConfig = jest.fn().mockReturnValue(mockBackendConfig);
        amplify_cli_core_1.stateManager.setBackendConfig = jest.fn();
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockBackendConfig);
        amplify_cli_core_1.stateManager.setMeta = jest.fn();
        const prompterMock = amplify_prompts_1.prompter;
        prompterMock.pick.mockResolvedValueOnce(['mockCategory1']).mockResolvedValueOnce(['mockResourceName1']);
        await (0, dependency_management_utils_1.addCFNResourceDependency)(mockContext, 'customResourcename');
        expect(writeCFNTemplate_mock).toBeCalledWith({
            Outputs: { mockKey: { Value: 'mockValue' } },
            Parameters: {
                mockCategory1mockResourceName1mockKey: {
                    Description: 'Input parameter describing mockKey attribute for mockCategory1/mockResourceName1 resource',
                    Type: 'String',
                },
            },
        }, expect.anything(), { templateFormat: 'json' });
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith('custom', 'customResourcename', 'dependsOn', [
            { attributes: ['mockKey'], category: 'mockCategory1', resourceName: 'mockResourceName1' },
        ]);
    });
});
//# sourceMappingURL=dependency-management-utils.test.js.map