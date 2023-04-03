"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ddb_stack_transform_1 = require("../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform");
const dynamoDB_user_input_types_1 = require("../../../../provider-utils/awscloudformation/service-walkthrough-types/dynamoDB-user-input-types");
const dynamoDB_input_state_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state");
jest.mock('amplify-cli-core', () => ({
    buildOverrideDir: jest.fn().mockResolvedValue(false),
    JSONUtilities: {
        writeJson: jest.fn(),
        readJson: jest.fn(),
    },
    pathManager: {
        getBackendDirPath: jest.fn().mockReturnValue('mockbackendpath'),
        getResourceDirectoryPath: jest.fn().mockReturnValue('mockresourcepath'),
    },
}));
jest.mock('fs-extra', () => ({
    readFileSync: () => jest.fn().mockReturnValue('{ "Cognito": { "provider": "aws"}}'),
    existsSync: () => jest.fn().mockReturnValue(true),
    ensureDirSync: jest.fn().mockReturnValue(true),
}));
jest.mock('path', () => ({
    join: jest.fn().mockReturnValue('src/__tests__/mockjoinedpath'),
    resolve: jest.fn().mockReturnValue('src/__tests__/mockjoinedpath'),
}));
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');
describe('Test DDB transform generates correct CFN template', () => {
    let mockContext;
    beforeEach(() => {
        mockContext = {
            amplify: {
                getCategoryPluginInfo: (_context, category) => {
                    return {
                        packageLocation: `@aws-amplify/amplify-category-${category}`,
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
    it('Generated ddb template with all CLI configurations set with no overrides', async () => {
        const resourceName = 'mockResource';
        const cliInputsJSON = {
            resourceName: resourceName,
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
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'getCliInputPayload').mockImplementation(() => cliInputsJSON);
        const ddbTransform = new ddb_stack_transform_1.DDBStackTransform(mockContext, resourceName);
        await ddbTransform.transform();
        expect(ddbTransform._cfn).toMatchSnapshot();
        expect(ddbTransform._cfnInputParams).toMatchSnapshot();
    });
});
//# sourceMappingURL=ddb-stack-transform.test.js.map