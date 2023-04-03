"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentStepStatus = exports.DeploymentStatus = void 0;
var DeploymentStatus;
(function (DeploymentStatus) {
    DeploymentStatus["IDLE"] = "IDLE";
    DeploymentStatus["DEPLOYING"] = "DEPLOYING";
    DeploymentStatus["DEPLOYED"] = "DEPLOYED";
    DeploymentStatus["ROLLING_BACK"] = "ROLLING_BACK";
    DeploymentStatus["ROLLED_BACK"] = "ROLLED_BACK";
    DeploymentStatus["FAILED"] = "FAILED";
})(DeploymentStatus = exports.DeploymentStatus || (exports.DeploymentStatus = {}));
var DeploymentStepStatus;
(function (DeploymentStepStatus) {
    DeploymentStepStatus["WAITING_FOR_DEPLOYMENT"] = "WAITING_FOR_DEPLOYMENT";
    DeploymentStepStatus["DEPLOYING"] = "DEPLOYING";
    DeploymentStepStatus["DEPLOYED"] = "DEPLOYED";
    DeploymentStepStatus["WAITING_FOR_TABLE_TO_BE_READY"] = "WAITING_FOR_TABLE_TO_BE_READY";
    DeploymentStepStatus["WAITING_FOR_ROLLBACK"] = "WAITING_FOR_ROLLBACK";
    DeploymentStepStatus["ROLLING_BACK"] = "ROLLING_BACK";
    DeploymentStepStatus["ROLLED_BACK"] = "ROLLED_BACK";
})(DeploymentStepStatus = exports.DeploymentStepStatus || (exports.DeploymentStepStatus = {}));
//# sourceMappingURL=deploymentState.js.map