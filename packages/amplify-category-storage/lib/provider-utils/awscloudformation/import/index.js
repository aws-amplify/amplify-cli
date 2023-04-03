"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importResource = void 0;
const import_s3_1 = require("./import-s3");
const import_dynamodb_1 = require("./import-dynamodb");
const importResource = async (context, categoryName, serviceSelection) => {
    if (serviceSelection.service === 'S3') {
        await (0, import_s3_1.importS3)(context, serviceSelection, undefined);
    }
    else if (serviceSelection.service === 'DynamoDB') {
        await (0, import_dynamodb_1.importDynamoDB)(context, serviceSelection, undefined);
    }
    else {
        throw new Error(`Unsupported service for import: ${serviceSelection.service}`);
    }
};
exports.importResource = importResource;
//# sourceMappingURL=index.js.map