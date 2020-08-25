const generateModels = require("../../src/commands/models");
const { codegen } = require('@graphql-codegen/core');
const { preset } = require('amplify-codegen-appsync-model-plugin');
const { parse } = require('graphql');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

const MOCK_CONTEXT = {
    amplify: {
        getProjectMeta: jest.fn(),
        getEnvInfo: jest.fn(),
        getResourceStatus: jest.fn(),
        getProjectConfig: jest.fn(),
        executeProviderUtils: jest.fn(),
        updateProjectConfig: jest.fn(),
        pathManager: {
            getBackendDirPath: jest.fn(),
        },
    },
    parameters: {
        options: {},
    },
    print: {
        info: jest.fn(),
    }
}

const MOCK_PROJECT_ROOT = 'MOCK_PROJECT_ROOT';
const MOCK_SCHEMA = 'SCHEMA.GRAPHQL';
const MOCK_RESOURCE_NAME = 'MOCK_RESOURCE_NAME';
const MOCK_BACKEND_PATH = 'MOCK_BACKEND_PATH';
const MOCK_RESOURCES = {
    allResources: [
        {
            service: 'AppSync',
            providerPlugin: 'awscloudformation',
            resourceName: MOCK_RESOURCE_NAME
        }
    ]
}

const MOCK_SDK = 'MOCK_SDK';
const MOCK_OUTPUT_PATH = 'MOCK_OUTPUT_PATH';
const DEFAULT_SDK_PATH = {
    javascript: 'src/models',
    android: 'app/src/main/java',
    ios: 'amplify/generated/models',
}


jest.mock('amplify-codegen-appsync-model-plugin');
jest.mock('@graphql-codegen/core');
jest.mock('graphql');
jest.mock('fs-extra');
jest.mock('inquirer');

describe('command - models', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        MOCK_CONTEXT.amplify.getEnvInfo.mockReturnValue({projectPath: MOCK_PROJECT_ROOT});
        MOCK_CONTEXT.amplify.getResourceStatus.mockReturnValue(MOCK_RESOURCES);
        MOCK_CONTEXT.amplify.pathManager.getBackendDirPath.mockReturnValue(MOCK_BACKEND_PATH);
        MOCK_CONTEXT.parameters.options.configpath = false;
        parse.mockReturnValue(MOCK_SCHEMA);
        preset.buildGeneratesSection.mockReturnValue([{}]);
        fs.pathExistsSync.mockReturnValue(true);
    });

    it('should generate models in root if no frontend type is found', async () => {
        MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({});
        await generateModels(MOCK_CONTEXT);
        expect(inquirer.prompt).not.toHaveBeenCalled();
        expect(preset.buildGeneratesSection).toHaveBeenCalledWith({
            baseOutputDir: MOCK_PROJECT_ROOT,
            config: {
                directives: undefined,
                target: undefined
            },
            schema: MOCK_SCHEMA,
        });
        expect(codegen).toHaveBeenCalled();
    });

    describe('should generate models in default path if frontend is defined and no flags are passed', () => {
        Object.entries(DEFAULT_SDK_PATH).forEach(([sdk, outputPath]) => {
            it(`should generate models in ${sdk} by default path ${outputPath}`, async () => {
                MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({frontend: sdk});
                await generateModels(MOCK_CONTEXT);
                expect(inquirer.prompt).not.toHaveBeenCalled();
                expect(preset.buildGeneratesSection).toHaveBeenCalledWith({
                    baseOutputDir: path.join(MOCK_PROJECT_ROOT, outputPath),
                    config: {
                        directives: undefined,
                        target: sdk
                    },
                    schema: MOCK_SCHEMA,
                });
                expect(codegen).toHaveBeenCalled();
            })
        });
    });

    it('should ask for the output path if configpath flag is passed', async () => {
        MOCK_CONTEXT.parameters.options.configPath = true;
        MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({frontend: MOCK_SDK});
        inquirer.prompt.mockReturnValue({outputPath: MOCK_OUTPUT_PATH});
        await generateModels(MOCK_CONTEXT);
        const question = inquirer.prompt.mock.calls[0][0];
        expect(question.name).toEqual('outputPath');
        expect(question.type).toEqual('input');
        expect(preset.buildGeneratesSection).toHaveBeenCalledWith({
            baseOutputDir: path.join(MOCK_PROJECT_ROOT, MOCK_OUTPUT_PATH),
            config: {
                directives: undefined,
                target: MOCK_SDK
            },
            schema: MOCK_SCHEMA,
        });
        expect(codegen).toHaveBeenCalled();
    });
})
