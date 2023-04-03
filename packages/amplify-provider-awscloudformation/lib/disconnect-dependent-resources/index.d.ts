import { $TSContext } from 'amplify-cli-core';
import { S3 } from '../aws-utils/aws-s3';
import { DeploymentStep } from '../iterative-deployment';
export declare const prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables: (context: $TSContext, modelsBeingReplaced: string[], deploymentSteps: DeploymentStep[]) => Promise<DeploymentStep[]>;
export declare const postDeploymentCleanup: (s3Client: S3, deploymentBucketName: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map