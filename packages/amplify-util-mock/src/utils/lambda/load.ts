import * as fs from 'fs-extra';
import * as path from 'path';
import { LambdaFunctionConfig, processResources } from '../../CFNParser/lambda-resource-processor';

export function getAllLambdaFunctions(context, backendPath: string): LambdaFunctionConfig[] {
  const lambdas: LambdaFunctionConfig[] = [];
  const lambdaCategoryPath = path.join(backendPath, 'function');
  if (fs.existsSync(lambdaCategoryPath) && fs.lstatSync(lambdaCategoryPath).isDirectory) {
    fs.readdirSync(lambdaCategoryPath)
      .filter(p => {
        const lambdaDir = path.join(lambdaCategoryPath, p);
        return fs.existsSync(lambdaDir) && fs.lstatSync(lambdaDir).isDirectory;
      })
      .forEach(resourceName => {
        const lambdaDir = path.join(lambdaCategoryPath, resourceName);
        const cfnPath = path.join(lambdaDir, `${resourceName}-cloudformation-template.json`);
        const cfnParams = path.join(lambdaDir, 'function-parameters.json');
        try {
          const lambdaCfn = context.amplify.readJsonFile(cfnPath);
          const lambdaCfnParams = fs.existsSync(cfnParams) ? context.amplify.readJsonFile(cfnParams) : {};
          const lambdaConfig = processResources(lambdaCfn.Resources, {}, { ...lambdaCfnParams, env: 'NONE' });
          lambdaConfig.basePath = path.join(lambdaDir, 'src');
          lambdas.push(lambdaConfig);
        } catch (e) {
          context.print.error(`Failed to parse Lambda function cloudformation in ${cfnPath}`);
          context.print.error(`\n${e}`);
        }
      });
  }
  return lambdas;
}
