import {
  stateManager,
  pathManager,
  readCFNTemplate,
  writeCFNTemplate,
  CustomIAMPolicy,
  CustomIAMPolicies,
  customExecutionPolicyForFunction,
  customExecutionPolicyForContainer,
  CustomPoliciesFormatError,
  CustomIAMPoliciesSchema} from 'amplify-cli-core';
import * as path from 'path';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';
import { Fn, Template } from 'cloudform-types';
import { printer } from 'amplify-prompts';
import Ajv from 'ajv';
import * as iam from '@aws-cdk/aws-iam';


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

//get data from custom polcies file and write custom policies to CFN template
export async function writeCustomPoliciesToCFNTemplate(
  resourceName: string,
  service: string,
  cfnFile: string,
  category: string
) {
  const customPolicySupportedServices = ['Lambda', 'ElasticContainer'];
  if (!customPolicySupportedServices.includes(service)) {
    return;
  }
  const resourceDir = pathManager.getResourceDirectoryPath(undefined, category, resourceName);
  const cfnPath = path.join(resourceDir, cfnFile);
  const { templateFormat, cfnTemplate } = await readCFNTemplate(cfnPath);
  const customPolicies = stateManager.getCustomPolicies(category, resourceName);
  if (!doCustomPoliciesExist(customPolicies)) {
    if (cfnTemplate.Resources.CustomLambdaExecutionPolicy) {
      delete cfnTemplate.Resources.CustomLambdaExecutionPolicy;
      await writeCFNTemplate(cfnTemplate, cfnPath, { templateFormat });
    }
    if (cfnTemplate.Resources.CustomExecutionPolicyForContainer) {
      delete cfnTemplate.Resources.CustomExecutionPolicyForContainer;
      await writeCFNTemplate(cfnTemplate, cfnPath, { templateFormat });
    }
    return;
  }
  await validateCustomPoliciesSchema(customPolicies, category, resourceName);

  const newCfnTemplate = await addCustomPoliciesToCFNTemplate(service, category, customPolicies, cfnTemplate, resourceName );

  await writeCFNTemplate(newCfnTemplate, cfnPath, { templateFormat });

}

//merge the custom IAM polciies to CFN template for lambda and API container

async function addCustomPoliciesToCFNTemplate(
  service: string,
  category: string,
  customPolicies: CustomIAMPolicies,
  cfnTemplate: Template,
  resourceName: string
  ) {
  let customExecutionPolicy;
  if(service === 'Lambda') {
    customExecutionPolicy = customExecutionPolicyForFunction;
  }
  if (service === 'ElasticContainer') {
    const roleName = cfnTemplate.Resources.TaskDefinition.Properties.ExecutionRoleArn["Fn::GetAtt"][0];
    customExecutionPolicy = customExecutionPolicyForContainer;
    const role = Fn.Ref(roleName);
    customExecutionPolicy.Properties.Roles.push(role);
  }

  warnWildcardCustomPolicies(customPolicies, resourceName);

  for (const customPolicy of customPolicies) {
    validateCustomPolicy(customPolicy, category, resourceName);
    const policyWithEnv = replaceEnvForCustomPolicies(customPolicy);
    if (!policyWithEnv.Effect) policyWithEnv.Effect = iam.Effect.ALLOW;
    customExecutionPolicy.Properties.PolicyDocument.Statement.push(policyWithEnv);
  }

  if (service === 'Lambda') {
    cfnTemplate.Resources.CustomLambdaExecutionPolicy = customExecutionPolicy;
  }
  if (service === 'ElasticContainer') {
    cfnTemplate.Resources.CustomExecutionPolicyForContainer = customExecutionPolicy;
  }

  return cfnTemplate;
}


//validate the format of actions and ARNs for custom IAM policies
function validateCustomPolicy(customPolicy: CustomIAMPolicy, category: string, resourceName: string) {
  const resources = customPolicy.Resource;
  const actions = customPolicy.Action;
  const resourceRegex = new RegExp('arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:([a-z]{2}(-gov)?-[a-z]+-\\d{1})?:(\\d{12})?:(.*)');
  const actionRegex = new RegExp('[a-zA-Z0-9]+:[a-z|A-Z|0-9|*]+');
  const wrongResourcesRegex = [];
  const wrongActionsRegex = [];
  let errorMessage = '';

  for (const resource of resources) {
    if (!(resourceRegex.test(resource) || resource === '*')) {
      wrongResourcesRegex.push(resource);
    }
  }

  for (const action of actions) {
    if (!actionRegex.test(action)) {
      wrongActionsRegex.push(action);
    }
  }

  const customPoliciesPath = pathManager.getCustomPoliciesPath(category, resourceName);

  if (wrongResourcesRegex.length > 0) {
    errorMessage += `Invalid custom IAM policy for ${resourceName}. Incorrect "Resource": ${wrongResourcesRegex.toString()}\n Edit ${customPoliciesPath} to fix`;
  }
  if (wrongActionsRegex.length > 0) {
    errorMessage += `Invalid custom IAM policy for ${resourceName}. Incorrect "Action": ${wrongActionsRegex.toString()}\n Edit ${customPoliciesPath} to fix`;
  }

  if (errorMessage.length > 0) {
    throw new CustomPoliciesFormatError(errorMessage);
  }
}

function doCustomPoliciesExist(customPolicies: CustomIAMPolicies) : Boolean | PromiseLike<any> {
  if (!customPolicies || customPolicies.length === 0) {
    return false;
  }

  if (customPolicies.length === 1
    && customPolicies[0].Action?.length === 0
    && customPolicies[0].Resource?.length === 0) {
      return false;
    }

  return true;
}

//replace or add env parameter in the front of the resource customers enter to the current env
function replaceEnvForCustomPolicies(policy: CustomIAMPolicy) : CustomIAMPolicy {
  const resource = policy.Resource.map(resource => resource.includes('${env}') ? Fn.Sub(resource, {'env': Fn.Ref('env')}) : resource) as any[];
  policy.Resource = resource;
  return policy;
}


async function validateCustomPoliciesSchema(data: CustomIAMPolicies, categoryName: string, resourceName: string) {
  const ajv = new Ajv();
  //validate if the policies match the custom IAM policies schema, if not, then not write into the CFN template
  const validatePolicy = ajv.compile(CustomIAMPoliciesSchema);

  if(!validatePolicy(data)) {
    let errorMessage = `Invalid custom IAM policies in the ${resourceName} ${categoryName}.\n
    Edit <project-dir>/amplify/backend/function/${resourceName}/custom-policies.json to fix
    Learn more about custom IAM policies for ${categoryName}: https://docs.amplify.aws/function/custom-policies\n`;
    validatePolicy.errors.forEach(error => errorMessage += `error.message\n`);
    throw new CustomPoliciesFormatError(errorMessage);
  }
}

function warnWildcardCustomPolicies(customPolicies: CustomIAMPolicy[], resourceName: string) {
  customPolicies
    .filter(policy => policy.Resource.includes('*'))
    .forEach(policy =>printer.warn(`Warning: You've specified "*" as the "Resource" in ${resourceName}'s custom IAM policy.\n This will grant ${resourceName} the ability to perform ${policy.Action} on ALL resources in this AWS Account.`))
}