"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const import_dynamodb_1 = require("../../../../provider-utils/awscloudformation/import/import-dynamodb");
test('throws amplify error when ddb headless params are missing during import storage', async () => {
    const resourceParams = {
        resourceName: 'mockResourceName',
        serviceType: 'imported',
    };
    expect(() => (0, import_dynamodb_1.ensureHeadlessParameters)(resourceParams, {
        region: 'mockRegion',
        tables: {
            table1: '',
            table2: '',
        },
    })).toThrowErrorMatchingInlineSnapshot(`"storage headless expected 1 element for resource: mockResourceName, but found: 0"`);
    expect(() => (0, import_dynamodb_1.ensureHeadlessParameters)(resourceParams, {
        region: '',
        tables: {
            table1: 'mockTable1',
            table2: 'mockTable2',
        },
    })).toThrowErrorMatchingInlineSnapshot(`"storage headless is missing the following inputParams region"`);
});
//# sourceMappingURL=import-dynamodb.test.js.map