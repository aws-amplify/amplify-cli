import { ensureLambdaExecutionRoleOutputs } from './prePushHandler';
/**
 * prePush Handler event for function category
 */
export const preExportHandler = async (): Promise<void> => {
  await ensureLambdaExecutionRoleOutputs();
};
