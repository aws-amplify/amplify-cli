import { stateManager, pathManager, readCFNTemplate, writeCFNTemplate,
  CustomIAMPolicies, CustomIAMPolicy, CustomPoliciesFormatError } from 'amplify-cli-core';
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
  if (customPolicies === undefined) return;

  if(category === 'function') {
    await addCustomPoliciesToCFNTemplateForFunction(customPolicies, cfnTemplate, filePath, {templateFormat} );
  }
  if(category === 'api') {
    await addCustomPoliciesToCFNTemplateForContainer(customPolicies, cfnTemplate, filePath, {templateFormat});
  }

}

export async function addCustomPoliciesToCFNTemplateForFunction(
  customPolicies: CustomIAMPolicies,
  cfnTemplate: Template,
  filePath: string,
  {templateFormat}
  ) {
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
    await validateRegexForCustomPolicies(customPolicy);
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
    await validateRegexForCustomPolicies(customPolicy);
    customexecutionpolicyforcontainer.Properties.PolicyDocument.Statement.push(customPolicy);
  }
  cfnTemplate.Resources["CustomExecutionPolicyForContainer"] = customexecutionpolicyforcontainer;
  await writeCFNTemplate(cfnTemplate, filePath, { templateFormat })
}

export async function validateRegexForCustomPolicies (customPolicy: CustomIAMPolicy) {
  const resources = customPolicy.Resource;
  const actions = customPolicy.Action;
  let resourceRegex = new RegExp('arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:([a-z]{2}(-gov)?-[a-z]+-\\d{1})?:(\\d{12})?:(.*)');
  let actionRegex = new RegExp('([a-z0-9])*:([a-z|A-Z|0-9|*]+)*');
  let wrongResourcesRegex = [];
  let wrongActionsRegex = [];
  let errorMessage = "";

  for (const resource of resources) {
    if (!resourceRegex.test(resource)) {
      wrongResourcesRegex.push(resource);
    }
  }

  for (const action of actions) {
    if (!actionRegex.test(action)) {
      wrongActionsRegex.push(action);
    }
  }

  if (wrongResourcesRegex.length != 0) {
    errorMessage += '\nInvalid ARN format:\n' + wrongResourcesRegex.toString() +'\n';
  }
  if (wrongActionsRegex.length != 0) {
    errorMessage += '\nInvalid actions format:\n' + wrongActionsRegex.toString() +'\n';
  }

  if (errorMessage.length > 0) {
    throw new CustomPoliciesFormatError(errorMessage);
  }


}
