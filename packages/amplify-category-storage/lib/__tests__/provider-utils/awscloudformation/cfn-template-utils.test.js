"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cfn_template_utils_1 = require("../../../provider-utils/awscloudformation/cfn-template-utils");
const amplify_cli_core_1 = require("amplify-cli-core");
jest.mock('amplify-cli-core');
const pathManager_mock = amplify_cli_core_1.pathManager;
const readCFNTemplate_mock = amplify_cli_core_1.readCFNTemplate;
pathManager_mock.getBackendDirPath.mockReturnValue('/test/path');
describe('get existing table column names', () => {
    it('returns empty array when no template exists', async () => {
        readCFNTemplate_mock.mockReturnValueOnce(undefined);
        const result = await (0, cfn_template_utils_1.getExistingTableColumnNames)('testResource');
        expect(result).toEqual([]);
    });
    it('returns empty array when no table in template', async () => {
        readCFNTemplate_mock.mockReturnValueOnce({
            cfnTemplate: {
                Resources: {
                    NoTablesHere: {
                        Type: 'AWS::NotATable',
                    },
                },
            },
        });
        const result = await (0, cfn_template_utils_1.getExistingTableColumnNames)('testResource');
        expect(result).toEqual([]);
    });
    it('returns empty array when table has no attributes', async () => {
        readCFNTemplate_mock.mockReturnValueOnce({
            cfnTemplate: {
                Resources: {
                    TestTable: {
                        Type: 'AWS::DynamoDB::Table',
                        Properties: {
                            AttributeDefinitions: [],
                        },
                    },
                },
            },
        });
        const result = await (0, cfn_template_utils_1.getExistingTableColumnNames)('testResource');
        expect(result).toEqual([]);
    });
    it('returns attribute names when present', async () => {
        readCFNTemplate_mock.mockReturnValueOnce({
            cfnTemplate: {
                Resources: {
                    TestTable: {
                        Type: 'AWS::DynamoDB::Table',
                        Properties: {
                            AttributeDefinitions: [
                                {
                                    AttributeName: 'col1',
                                },
                                {
                                    AttributeName: 'col2',
                                },
                            ],
                        },
                    },
                },
            },
        });
        const result = await (0, cfn_template_utils_1.getExistingTableColumnNames)('restResource');
        expect(result).toEqual(['col1', 'col2']);
    });
});
//# sourceMappingURL=cfn-template-utils.test.js.map