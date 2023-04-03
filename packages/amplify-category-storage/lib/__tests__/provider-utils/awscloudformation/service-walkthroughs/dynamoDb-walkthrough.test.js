"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const dynamoDB_input_state_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state");
const ddb_stack_transform_1 = require("../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform");
const dynamoDb_walkthrough_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDb-walkthrough");
const dynamoDB_user_input_types_1 = require("../../../../provider-utils/awscloudformation/service-walkthrough-types/dynamoDB-user-input-types");
jest.mock('amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');
jest.mock('../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform');
describe('add ddb walkthrough tests', () => {
    let mockContext;
    beforeEach(() => {
        mockContext = {
            amplify: {
                getProjectDetails: () => {
                    return {
                        projectConfig: {
                            projectName: 'mockProject',
                        },
                    };
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
    it('addWalkthrough() test', async () => {
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'saveCliInputPayload').mockImplementation(async () => undefined);
        jest.spyOn(ddb_stack_transform_1.DDBStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        const expectedCLIInputsJSON = {
            resourceName: 'mockresourcename',
            tableName: 'mocktablename',
            partitionKey: {
                fieldName: 'id',
                fieldType: dynamoDB_user_input_types_1.FieldType.string,
            },
            sortKey: {
                fieldName: 'name',
                fieldType: dynamoDB_user_input_types_1.FieldType.number,
            },
            gsi: [
                {
                    name: 'gsiname',
                    partitionKey: {
                        fieldName: 'name',
                        fieldType: dynamoDB_user_input_types_1.FieldType.number,
                    },
                },
                {
                    name: 'secondgsiname',
                    partitionKey: {
                        fieldName: 'id',
                        fieldType: dynamoDB_user_input_types_1.FieldType.string,
                    },
                    sortKey: {
                        fieldName: 'name',
                        fieldType: dynamoDB_user_input_types_1.FieldType.number,
                    },
                },
            ],
            triggerFunctions: [],
        };
        amplify_prompts_1.prompter.input = jest
            .fn()
            .mockReturnValueOnce('mockresourcename')
            .mockResolvedValueOnce('mocktablename')
            .mockResolvedValueOnce('id')
            .mockResolvedValueOnce('name')
            .mockResolvedValueOnce('gsiname')
            .mockResolvedValueOnce('secondgsiname');
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockReturnValueOnce('string')
            .mockReturnValueOnce('number')
            .mockReturnValueOnce('id')
            .mockReturnValueOnce('name')
            .mockReturnValueOnce('name')
            .mockReturnValueOnce('id')
            .mockReturnValueOnce('name');
        amplify_prompts_1.prompter.yesOrNo = jest
            .fn()
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        const returnedResourcename = await (0, dynamoDb_walkthrough_1.addWalkthrough)(mockContext, 'dynamoDb-defaults');
        expect(returnedResourcename).toEqual('mockresourcename');
        expect(dynamoDB_input_state_1.DynamoDBInputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
});
describe('update ddb walkthrough tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.mock('@aws-amplify/amplify-prompts');
        mockContext = {
            amplify: {
                getProjectDetails: () => {
                    return {
                        projectConfig: {
                            projectName: 'mockProject',
                        },
                    };
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
    it('updateWalkthrough() test to add gsi', async () => {
        let mockAmplifyMeta = {
            storage: {
                mockresourcename: {
                    service: 'DynamoDB',
                    providerPlugin: 'awscloudformation',
                },
                dynamoefb50875: {
                    service: 'DynamoDB',
                    providerPlugin: 'awscloudformation',
                },
            },
        };
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        const currentCLIInputsJSON = {
            resourceName: 'mockresourcename',
            tableName: 'mocktablename',
            partitionKey: {
                fieldName: 'id',
                fieldType: dynamoDB_user_input_types_1.FieldType.string,
            },
            sortKey: {
                fieldName: 'name',
                fieldType: dynamoDB_user_input_types_1.FieldType.number,
            },
            gsi: [
                {
                    name: 'gsiname',
                    partitionKey: {
                        fieldName: 'name',
                        fieldType: dynamoDB_user_input_types_1.FieldType.number,
                    },
                },
            ],
            triggerFunctions: [],
        };
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'getCliInputPayload').mockImplementation(() => currentCLIInputsJSON);
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'saveCliInputPayload').mockImplementation(async () => undefined);
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        jest.spyOn(ddb_stack_transform_1.DDBStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());
        amplify_prompts_1.prompter.input = jest
            .fn()
            .mockResolvedValueOnce('col')
            .mockResolvedValueOnce('updategsiname');
        amplify_prompts_1.prompter.pick = jest
            .fn()
            .mockReturnValueOnce('mockresourcename')
            .mockReturnValueOnce('string')
            .mockReturnValueOnce('col')
            .mockReturnValueOnce('name');
        amplify_prompts_1.prompter.yesOrNo = jest
            .fn()
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false);
        amplify_prompts_1.prompter.confirmContinue = jest.fn().mockReturnValueOnce(false);
        const returnedCLIInputs = await (0, dynamoDb_walkthrough_1.updateWalkthrough)(mockContext);
        const expectedCLIInputsJSON = {
            resourceName: 'mockresourcename',
            tableName: 'mocktablename',
            partitionKey: {
                fieldName: 'id',
                fieldType: dynamoDB_user_input_types_1.FieldType.string,
            },
            sortKey: {
                fieldName: 'name',
                fieldType: dynamoDB_user_input_types_1.FieldType.number,
            },
            gsi: [
                {
                    name: 'gsiname',
                    partitionKey: {
                        fieldName: 'name',
                        fieldType: dynamoDB_user_input_types_1.FieldType.number,
                    },
                },
                {
                    name: 'updategsiname',
                    partitionKey: {
                        fieldName: 'col',
                        fieldType: dynamoDB_user_input_types_1.FieldType.string,
                    },
                },
            ],
            triggerFunctions: [],
        };
        expect(returnedCLIInputs).toEqual(expectedCLIInputsJSON);
        expect(dynamoDB_input_state_1.DynamoDBInputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
    });
});
//# sourceMappingURL=dynamoDb-walkthrough.test.js.map