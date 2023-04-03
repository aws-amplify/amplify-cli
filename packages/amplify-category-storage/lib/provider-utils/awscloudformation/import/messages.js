"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMessages = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.importMessages = {
    NoS3BucketsToImport: 'No S3 Buckets were found to import.',
    OneBucket: (bucketName) => `${greenCheck} Only one S3 Bucket (${bucketName}) found and it was automatically selected.`,
    BucketSelection: 'Select the S3 Bucket you want to import:',
    AutoCompleteFooter: '(Type in a partial name or scroll up and down to reveal more choices)',
    ImportPreviousBucket: (resourceName, bucketName, envName) => `The resource: '${resourceName}' (S3: '${bucketName}') already imported to '${envName}' environment, do you want to import it to the new environment?`,
    ImportPreviousResourceFooter: `If you choose No, then an import walkthrough will run to import a different resource into the new environment.`,
    ImportNewResourceRequired: (resourceName) => `Imported resource: '${resourceName}' found, parameters are required for environment creation.`,
    BucketNotFound: (bucketName) => `The previously configured S3 Bucket: '${bucketName}' cannot be found.`,
    NoDynamoDBTablesToImport: 'No DynamoDB Tables were found to import.',
    OneTable: (tableName) => `${greenCheck} Only one DynamoDB Table (${tableName}) found and it was automatically selected.`,
    TableSelection: 'Select the DynamoDB Table you want to import:',
    ImportPreviousTable: (resourceName, tableName, envName) => `The resource: '${resourceName}' (DynamoDB Table: '${tableName}') already imported to '${envName}' environment, do you want to import it to the new environment?`,
    TableNotFound: (tableName) => `The previously configured DynamoDB Table: '${tableName}' cannot be found.`,
};
const greenCheck = chalk_1.default.green('✔');
//# sourceMappingURL=messages.js.map