"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIterativeRollback = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const deployment_manager_1 = require("./deployment-manager");
const aws_s3_1 = require("../aws-utils/aws-s3");
const user_agent_1 = require("../aws-utils/user-agent");
const prevDeploymentStatus = [
    amplify_cli_core_1.DeploymentStepStatus.DEPLOYING,
    amplify_cli_core_1.DeploymentStepStatus.ROLLING_BACK,
    amplify_cli_core_1.DeploymentStepStatus.DEPLOYED,
    amplify_cli_core_1.DeploymentStepStatus.WAITING_FOR_ROLLBACK,
];
const loadDeploymentMeta = async (s3, bucketName, metaKey) => {
    const metaDeploymentContent = await s3.getStringObjectFromBucket(bucketName, metaKey);
    if (metaDeploymentContent) {
        return amplify_cli_core_1.JSONUtilities.parse(metaDeploymentContent);
    }
    throw new amplify_cli_core_1.AmplifyError('IterativeRollbackError', {
        message: `Could not find deployment meta file: ${metaKey}`,
    });
};
const getParentStatePath = (files) => {
    if (!files)
        return null;
    if (files.length < 2)
        return files[0];
    files.sort();
    const longestFilePath = files[0];
    const smallestFilePath = files[files.length - 1];
    const longestFilePathLength = longestFilePath.length;
    let i = 0;
    while (i < longestFilePathLength && longestFilePath.charAt(i) === smallestFilePath.charAt(i))
        i++;
    return longestFilePath.substring(0, i);
};
const runIterativeRollback = async (context, cloudformationMeta, deploymentStateManager, eventMap) => {
    const deploymentBucket = cloudformationMeta.DeploymentBucketName;
    const deploymentStatus = deploymentStateManager.getStatus();
    const deployedSteps = deploymentStatus.steps.slice(0, deploymentStatus.currentStepIndex + 1);
    const s3 = await aws_s3_1.S3.getInstance(context);
    const deploymentManager = await deployment_manager_1.DeploymentManager.createInstance(context, deploymentBucket, eventMap, {
        userAgent: (0, user_agent_1.formUserAgentParam)(context, 'iterative-rollback'),
    });
    const rollbackSteps = new Array();
    const stateFiles = [];
    for (const step of deployedSteps) {
        if (!step.previousMetaKey) {
            throw new amplify_cli_core_1.AmplifyError('IterativeRollbackError', {
                message: `Cannot iteratively rollback as the following step does not contain a previousMetaKey: ${JSON.stringify(step)}`,
            });
        }
        const deploymentMeta = await loadDeploymentMeta(s3, deploymentBucket, step.previousMetaKey);
        if (prevDeploymentStatus.includes(step.status)) {
            rollbackSteps.push(deploymentMeta);
            stateFiles.push(step.previousMetaKey);
        }
    }
    if (rollbackSteps.length > 0) {
        rollbackSteps.forEach((step) => {
            deploymentManager.addRollbackStep(step);
        });
        await deploymentManager.rollback(deploymentStateManager);
        const stateS3Dir = getParentStatePath(stateFiles);
        await s3.deleteDirectory(deploymentBucket, stateS3Dir);
    }
};
exports.runIterativeRollback = runIterativeRollback;
//# sourceMappingURL=iterative-rollback.js.map