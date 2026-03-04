import { KinesisCloudFormationAccessParser } from '../../codegen-head/kinesis_cfn_access_parser';

export interface FunctionKinesisAccess {
  functionName: string;
  actions: string[];
}

export const extractFunctionKinesisAccess = (functionNames: string[]): FunctionKinesisAccess[] => {
  const functionAccess: FunctionKinesisAccess[] = [];

  for (const functionName of functionNames) {
    const templatePath = KinesisCloudFormationAccessParser.findFunctionCloudFormationTemplate(functionName);
    const kinesisPermissions = KinesisCloudFormationAccessParser.parseTemplateFile(templatePath);

    const allActions = new Set<string>();
    for (const permission of kinesisPermissions) {
      for (const action of permission.actions) {
        allActions.add(action);
      }
    }

    if (allActions.size > 0) {
      functionAccess.push({
        functionName,
        actions: Array.from(allActions),
      });
    }
  }

  return functionAccess;
};
