import { $TSAny } from 'amplify-cli-core';
import { CloudFormation } from 'aws-sdk';
import { S3 } from '../aws-utils/aws-s3';
import { DeploymentStep } from '../iterative-deployment';
export declare const getDependentFunctions: (modelNames: string[], functionNames: string[], functionParamsSupplier: (functionName: string) => Promise<$TSAny>) => Promise<string[]>;
export declare const generateTempFuncCFNTemplates: (dependentFunctions: string[]) => Promise<void>;
export declare const uploadTempFuncDeploymentFiles: (s3Client: S3, funcNames: string[]) => Promise<void>;
export declare const generateIterativeFuncDeploymentSteps: (cfnClient: CloudFormation, rootStackId: string, functionNames: string[]) => Promise<{
    deploymentSteps: DeploymentStep[];
    lastMetaKey: string;
}>;
export declare const prependDeploymentSteps: (beforeSteps: DeploymentStep[], afterSteps: DeploymentStep[], beforeStepsLastMetaKey: string) => DeploymentStep[];
export declare const s3Prefix = "amplify-cfn-templates/function/temp";
export declare const localPrefix: (funcName: string) => string;
//# sourceMappingURL=utils.d.ts.map