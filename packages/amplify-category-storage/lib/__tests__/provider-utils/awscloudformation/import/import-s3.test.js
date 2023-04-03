"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const import_s3_1 = require("../../../../provider-utils/awscloudformation/import/import-s3");
test('throws amplify error when s3 headless params are missing during import storage', async () => {
    expect(() => (0, import_s3_1.ensureHeadlessParameters)({
        bucketName: '',
        region: '',
    })).toThrowErrorMatchingInlineSnapshot(`"storage headless is missing the following inputParams bucketName, region"`);
});
//# sourceMappingURL=import-s3.test.js.map