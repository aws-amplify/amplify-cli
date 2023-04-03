"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerName = exports.FunctionServiceNameLambdaFunction = exports.templateFilenameMap = exports.storageParamsFilename = exports.ServiceName = void 0;
var ServiceName;
(function (ServiceName) {
    ServiceName["S3"] = "S3";
    ServiceName["DynamoDB"] = "DynamoDB";
})(ServiceName = exports.ServiceName || (exports.ServiceName = {}));
exports.storageParamsFilename = 'storage-params.json';
exports.templateFilenameMap = {
    [ServiceName.S3]: 's3-cloudformation-template.json.ejs',
    [ServiceName.DynamoDB]: 'dynamoDb-cloudformation-template.json.ejs',
};
exports.FunctionServiceNameLambdaFunction = 'Lambda';
exports.providerName = 'awscloudformation';
//# sourceMappingURL=provider-constants.js.map