import { stateManager, pathManager, readCFNTemplate, writeCFNTemplate, CustomIAMPolicies } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';
import { Template } from 'cloudform-types';

const buildDir = 'build';

/**
 * Runs transformations on a CFN template and returns a path to the transformed template
 *
 * Expects to be run in an initialized Amplify project
 * @param filePath the original template path
 * @returns The file path of the modified template
 */
export async function preProcessCFNTemplate(filePath: string): Promise<string> {
  const { templateFormat, cfnTemplate } = await readCFNTemplate(filePath);

  await prePushCfnTemplateModifier(cfnTemplate);

  const backendDir = pathManager.getBackendDirPath();
  const pathSuffix = filePath.startsWith(backendDir) ? filePath.slice(backendDir.length) : path.parse(filePath).base;
  const newPath = path.join(backendDir, providerName, buildDir, pathSuffix);

  await writeCFNTemplate(cfnTemplate, newPath, { templateFormat });
  return newPath;
}

export async function writeCustomPoliciesToCFNTemplate(
  resourceDir,
  cfnFile,
  category,
  filePath
) {
  const { templateFormat, cfnTemplate } = await readCFNTemplate(path.join(resourceDir, cfnFile));
  const customPolicies = await stateManager.getCustomPolicies(resourceDir);
  const customPath = pathManager.getCustomPoliciesPath(resourceDir);
  if(category === 'function' && fs.existsSync(customPath)) {
    await addCustomPoliciesToCFNTemplateForFunction(customPolicies, cfnTemplate, filePath, {templateFormat} );
  }
  if(category === 'api' && fs.existsSync(customPath)) {
    await addCustomPoliciesToCFNTemplateForContainer(customPolicies, cfnTemplate, filePath, {templateFormat});
  }

}

export async function addCustomPoliciesToCFNTemplateForFunction(
  customPolicies: CustomIAMPolicies,
  cfnTemplate: Template,
  filePath: string,
  {templateFormat}
  ) {
  if(customPolicies.policies === undefined || customPolicies.policies === null
    || customPolicies.policies.length === 0 || Object.keys(customPolicies.policies[0]).length === 0) {
    return;
  }
  const customlambdaexecutionpolicy = {
    "DependsOn": ["LambdaExecutionRole"],
    "Type": "AWS::IAM::Policy",
    "Properties": {
      "PolicyName": "custom-lambda-execution-policy",
      "Roles": [{ "Ref": "LambdaExecutionRole" }],
      "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [
        ]
      }
    }
  };
  for (const customPolicy of customPolicies.policies) {
    customlambdaexecutionpolicy.Properties.PolicyDocument.Statement.push(customPolicy);
  }
  cfnTemplate.Resources["CustomLambdaExecutionPolicy"] = customlambdaexecutionpolicy;
  await writeCFNTemplate(cfnTemplate, filePath, { templateFormat });
}

export async function addCustomPoliciesToCFNTemplateForContainer(
  customPolicies: CustomIAMPolicies,
  cfnTemplate: Template,
  filePath: string,
  {templateFormat}
  ) {
  if(customPolicies.policies === undefined || customPolicies.policies === null
    || customPolicies.policies.length === 0 || Object.keys(customPolicies.policies[0]).length === 0) {
    return;
  }
  const roleName = cfnTemplate.Resources.TaskDefinition.Properties.ExecutionRoleArn["Fn::GetAtt"][0];
  const customexecutionpolicyforcontainer = {
    "Type": "AWS::IAM::Policy",
    "Properties": {
      "PolicyDocument": {
        "Statement": [
        ],
        "Version": "2012-10-17"
      },
      "PolicyName": "CustomExecutionPolicyForContainer",
      "Roles": [
        {
          "Ref": roleName
        }
      ]
    }
  };
  for (const customPolicy of customPolicies.policies) {
    customexecutionpolicyforcontainer.Properties.PolicyDocument.Statement.push(customPolicy);
  }
  cfnTemplate.Resources["CustomExecutionPolicyForContainer"] = customexecutionpolicyforcontainer;
  await writeCFNTemplate(cfnTemplate, filePath, { templateFormat })
}
