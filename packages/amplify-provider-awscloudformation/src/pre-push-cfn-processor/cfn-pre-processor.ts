import { stateManager,
  pathManager,
  readCFNTemplate,
  writeCFNTemplate,
  CustomIAMPolicy,
  CustomIAMPolicySchema,
  CustomIAMPolicies,
  customExecutionPolicyForFunction,
  customExecutionPolicyForContainer,
  CustomPoliciesFormatError,
  CustomIAMPoliciesSchema,} from 'amplify-cli-core';
import * as path from 'path';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';
import { Fn, Template } from 'cloudform-types';
import { printer } from 'amplify-prompts';
import Ajv from "ajv";
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
  resourceDir: string,
  cfnFile: string,
  category: string,
  filePath: string
) {
  if (!(service === 'Lambda' || service === 'ElasticContainer')) {
    return;
  }
  const { templateFormat, cfnTemplate } = await readCFNTemplate(path.join(resourceDir, cfnFile));
  const customPolicies = stateManager.getCustomPolicies(category, resourceName);
  if (!validateExistCustomPolicies(customPolicies)) {
    if (cfnTemplate.Resources.CustomLambdaExecutionPolicy) {
      delete cfnTemplate.Resources.CustomLambdaExecutionPolicy;
      await writeCFNTemplate(cfnTemplate, filePath, { templateFormat });
    }
    if (cfnTemplate.Resources.CustomExecutionPolicyForContainer) {
      delete cfnTemplate.Resources.CustomExecutionPolicyForContainer;
      await writeCFNTemplate(cfnTemplate, filePath, { templateFormat });
    }
    return;
  }
  await validateCustomPoliciesSchema(customPolicies, category, resourceName);

  await addCustomPoliciesToCFNTemplate(service, category, customPolicies.policies, cfnTemplate, filePath, resourceName, {templateFormat} );

}

//merge the custom IAM polciies to CFN template for lambda and API container

async function addCustomPoliciesToCFNTemplate(
  service: string,
  category: string,
  customPolicies: CustomIAMPolicy[],
  cfnTemplate: Template,
  filePath: string,
  resourceName: string,
  {templateFormat}: any
  ) {
  let customExecutionPolicy;
  const { envName } = stateManager.getLocalEnvInfo();
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
    const policyWithEnv = await replaceEnvForCustomPolicies(customPolicy, envName);
    if (!policyWithEnv.Effect) policyWithEnv.Effect = iam.Effect.ALLOW;
    customExecutionPolicy.Properties.PolicyDocument.Statement.push(policyWithEnv);
  }

  if (service === 'Lambda') {
    cfnTemplate.Resources.CustomLambdaExecutionPolicy = customExecutionPolicy;
  }
  if (service === 'ElasticContainer') {
    cfnTemplate.Resources.CustomExecutionPolicyForContainer = customExecutionPolicy;
  }

  await writeCFNTemplate(cfnTemplate, filePath, { templateFormat });
}


//validate the format of actions and ARNs for custom IAM policies
function validateCustomPolicy(customPolicy: CustomIAMPolicy, category: string, resourceName: string) {
  const resources = customPolicy.Resource;
  const actions = customPolicy.Action;
  const resourceRegex = new RegExp('arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:([a-z]{2}(-gov)?-[a-z]+-\\d{1})?:(\\d{12})?:(.*)');
  const actionRegex = new RegExp('[a-zA-Z0-9]+:[a-z|A-Z|0-9|*]+');
  const wrongResourcesRegex = [];
  const wrongActionsRegex = [];
  let errorMessage = "";

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
    errorMessage += `Invalid custom IAM policy for {function name}. Incorrect "Resource": ${wrongResourcesRegex.toString()}\n Edit ${customPoliciesPath} to fix`;
  }
  if (wrongActionsRegex.length > 0) {
    errorMessage += `Invalid custom IAM policy for {function name}. Incorrect "Action": ${wrongActionsRegex.toString()}\n Edit ${customPoliciesPath} to fix`;
  }

  if (errorMessage.length > 0) {
    throw new CustomPoliciesFormatError(errorMessage);
  }
}

function validateExistCustomPolicies(customPolicies: CustomIAMPolicies) : Boolean {
  const ajv = new Ajv();
  const validatePolicies = ajv.compile(CustomIAMPoliciesSchema);


  if (!validatePolicies(customPolicies)) {
    return false;
  }

  if (customPolicies.policies.length === 1
    && customPolicies.policies[0].Action?.length === 0
    && customPolicies.policies[0].Resource?.length === 0) {
      return false;
    }

  return true;
}

//replace or add env parameter in the front of the resource customers enter to the current env
async function replaceEnvForCustomPolicies(policy: CustomIAMPolicy, currentEnv: string) : Promise<CustomIAMPolicy> {
  const resourceWithEnv = [];
  const action = policy.Action;
  const effect = policy.Effect;
  const customIAMpolicy: CustomIAMPolicy = {
    Action: action,
    Effect: effect,
    Resource: []
  }
  for (let resource of policy.Resource){
    if (resource.includes('${env}')) {
      resourceWithEnv.push(Fn.Sub(resource, {'env': Fn.Ref('env')}));
    }
    else {
      resourceWithEnv.push(resource);
    }
  }
  customIAMpolicy.Resource = resourceWithEnv;
  return customIAMpolicy;
}


async function validateCustomPoliciesSchema(data: CustomIAMPolicies, categoryName: string, resourceName: string) {
  const ajv = new Ajv();
  //validate if the policies match the custom IAM policies schema, if not, then not write into the CFN template
  const validatePolicy = ajv.compile(CustomIAMPolicySchema);

  for(const policy of data.policies) {
    if(!validatePolicy(policy)) {
      let errorMessage = `Invalid custom IAM policies in the ${resourceName} ${categoryName} is invalid.\n
      Edit <project-dir>/amplify/backend/function/socialmediademoea2a770a/custom-policies.json to fix
      Learn more about custom IAM policies for ${categoryName}: https://docs.amplify.aws/function/custom-policies`;
      validatePolicy.errors.forEach(error => errorMessage += error.message + "\n");
      throw new CustomPoliciesFormatError(errorMessage);
    }
  }
}

function warnWildcardCustomPolicies(customPolicies: CustomIAMPolicy[], resourceName: string) {
  customPolicies
    .filter(policy => policy.Resource.includes("*"))
    .forEach( policy =>printer.warn(`Warning: You've specified "*" as the "Resource" in ${resourceName}'s custom IAM policy.\n This will grant ${resourceName} the ability to perform ${policy.Action} on ALL resources in this AWS Account.`))
}