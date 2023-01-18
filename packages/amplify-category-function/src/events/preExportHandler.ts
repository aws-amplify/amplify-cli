import { ensureLambdaExecutionRoleOutputs } from '../provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs';
/**
 * prePush Handler event for function category
 */
export const preExportHandler = async (): Promise<void> => {
  await ensureLambdaExecutionRoleOutputs();
};
