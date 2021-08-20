import { stateManager, pathManager, readCFNTemplate, writeCFNTemplate,
  CustomIAMPolicies, CustomIAMPolicy, $TSContext } from 'amplify-cli-core';
import * as path from 'path';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';
import { Template } from 'cloudform-types';
import { Printer, AmplifyPrinter } from 'amplify-prompts';


const buildDir = 'build';

export const CustomPolicyFileContentConstant = {
  customExecutionPolicyForFunction : {
    DependsOn: ['LambdaExecutionRole'],
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: 'custom-lambda-execution-policy',
      Roles: [{ Ref: 'LambdaExecutionRole' }],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
        ]
      }
    }
  },
  customExecutionPolicyForContainer : {
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyDocument: {
        Statement: [
        ],
        Version: '2012-10-17'
      },
      PolicyName: 'CustomExecutionPolicyForContainer',
      Roles: [
      ]
    }
  }
};

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

//get data from custom polcies file and write custom policies to CFN template

export async function writeCustomPoliciesToCFNTemplate(
  resourceName: string,
  resourceDir: string,
  cfnFile: string,
  category: string,
  filePath: string
) {
  const { templateFormat, cfnTemplate } = await readCFNTemplate(path.join(resourceDir, cfnFile));
  const customPolicies = stateManager.getCustomPolicies(category, resourceName);
  if (!customPolicies) return;

  await addCustomPoliciesToCFNTemplate(category, customPolicies, cfnTemplate, filePath, resourceName, {templateFormat} );

}

//merge the custom IAM polciies to CFN template for lambda and API container

export async function addCustomPoliciesToCFNTemplate(
  category: string,
  customPolicies: CustomIAMPolicies,
  cfnTemplate: Template,
  filePath: string,
  resourceName: string,
  {templateFormat}: any
  ) {
  let customExecutionPolicy;

  if(category === 'function') {
    customExecutionPolicy = CustomPolicyFileContentConstant.customExecutionPolicyForFunction;
  }
  if (category === 'api') {
    const roleName = cfnTemplate.Resources.TaskDefinition.Properties.ExecutionRoleArn["Fn::GetAtt"][0];
    customExecutionPolicy = CustomPolicyFileContentConstant.customExecutionPolicyForContainer;
    const role = {Ref: `${roleName}`};
    customExecutionPolicy.Properties.Roles.push(role);
  }

  for (const customPolicy of customPolicies.policies) {
    validateRegexCustomPolicy(customPolicy, resourceName);
    customExecutionPolicy.Properties.PolicyDocument.Statement.push(customPolicy);
  }

  if (category === 'function') {
    cfnTemplate.Resources.CustomLambdaExecutionPolicy = customExecutionPolicy;
  }
  if (category === 'api') {
    cfnTemplate.Resources.CustomExecutionPolicyForContainer = customExecutionPolicy;
  }

  await writeCFNTemplate(cfnTemplate, filePath, { templateFormat });
}

//validate the format of actions and ARNs for custom IAM policies

export function validateRegexCustomPolicy (customPolicy: CustomIAMPolicy, resourceName: string) {
  const resources = customPolicy.Resource;
  const actions = customPolicy.Action;
  let resourceRegex = new RegExp('(arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:([a-z]{2}(-gov)?-[a-z]+-\\d{1})?:(\\d{12})?:(.*))*');
  let actionRegex = new RegExp('([a-z0-9])*:([a-z|A-Z|0-9|*]+)*');
  let wrongResourcesRegex = [];
  let wrongActionsRegex = [];
  let errorMessage = "";
  const printer: Printer = new AmplifyPrinter()

  for (const resource of resources) {
    if (!resourceRegex.test(resource)) {
      wrongResourcesRegex.push(resource);
    }
    if(resource === '*') {
      printer.warn(`Warning: You've specified "*" as a custom IAM policy for your ${resourceName}. 
      This will give your ${resourceName} access to ALL resources in the AWS Account.`)
    }
  }

  for (const action of actions) {
    if (!actionRegex.test(action)) {
      wrongActionsRegex.push(action);
    }
  }

  if (wrongResourcesRegex.length > 0) {
    errorMessage += `\nInvalid ARN format for custom IAM policies in ${resourceName}:\n${wrongResourcesRegex.toString()}\n`;
  }
  if (wrongActionsRegex.length > 0) {
    errorMessage += `\nInvalid actions format for custom IAM policies in ${resourceName}:\n${wrongActionsRegex.toString()}\n`;
  }

  if (errorMessage.length > 0) {
    printer.error(errorMessage);
  }


}
