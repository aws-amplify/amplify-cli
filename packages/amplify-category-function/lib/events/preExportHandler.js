"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preExportHandler = void 0;
const ensure_lambda_arn_outputs_1 = require("../provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs");
const preExportHandler = async () => {
    await (0, ensure_lambda_arn_outputs_1.ensureLambdaExecutionRoleOutputs)();
};
exports.preExportHandler = preExportHandler;
//# sourceMappingURL=preExportHandler.js.map