import { Fn, IAM, Template } from 'cloudform-types';
import { pathManager, stateManager } from './state-manager';
import Ajv from 'ajv';
import * as _ from 'lodash';
import { formatter, printer } from '@aws-amplify/amplify-prompts';
import { JSONUtilities } from './jsonUtilities';
import { CustomPoliciesFormatError } from './errors';
import { $TSObject } from './index';

export type CustomIAMPolicies = CustomIAMPolicy[];
export type CustomIAMPolicy = {
  Action: string[];
  Effect?: string;
  Resource: (string | $TSObject)[];
};

export const CustomIAMPoliciesSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    properties: {
      Action: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: false },
      Resource: {
        type: 'array',
        anyOf: [{ contains: { type: 'string' } }, { contains: { type: 'object', additionalProperties: true } }],
        minItems: 1,
        nullable: false,
      },
    },
    optionalProperties: {
      Effect: { type: 'string', enum: ['Allow', 'Deny'], default: 'Allow' },
    },
    required: ['Resource', 'Action'],
    additionalProperties: true,
  },
  additionalProperties: false,
};

export function createDefaultCustomPoliciesFile(categoryName: string, resourceName: string) {
  const customPoliciesPath = pathManager.getCustomPoliciesPath(categoryName, resourceName);
  const defaultCustomPolicies = [
    {
      Action: [],
      Resource: [],
    },
  ];
  JSONUtilities.writeJson(customPoliciesPath, defaultCustomPolicies);
}

export function generateCustomPoliciesInTemplate(template: Template, resourceName: string, service: string, category: string): Template {
  if ((category === 'api' && service === 'ElasticContainer') || (category === 'function' && service === 'Lambda')) {
    const customPolicies = stateManager.getCustomPolicies(category, resourceName);
    if (!resourceHasCustomPolicies(customPolicies)) {
      if (template.Resources && template.Resources.CustomLambdaExecutionPolicy) {
        delete template.Resources.CustomLambdaExecutionPolicy;
      }
      if (template.Resources && template.Resources.CustomExecutionPolicyForContainer) {
        delete template.Resources.CustomExecutionPolicyForContainer;
      }
      return template;
    }

    validateCustomPolicies(customPolicies, category, resourceName);
    return addCustomPoliciesToCFNTemplate(service, category, customPolicies, template, resourceName);
  }
  return template;
}

function addCustomPoliciesToCFNTemplate(
  service: string,
  category: string,
  customPolicies: CustomIAMPolicies,
  cfnTemplate: Template,
  resourceName: string,
): Template {
  warnWildcardCustomPoliciesResource(customPolicies, resourceName);
  const generatedCustomPolicies = generateCustomPolicyStatements(customPolicies);
  if (category === 'function' && service === 'Lambda') {
    return applyCustomPolicyToLambda(generatedCustomPolicies, cfnTemplate);
  }

  if (category === 'api' && service === 'ElasticContainer') {
    return applyCustomPolicyToElasticContainers(generatedCustomPolicies, cfnTemplate);
  }

  return cfnTemplate;
}

function generateCustomPolicyStatements(customPolicies: CustomIAMPolicies): CustomIAMPolicies {
  return customPolicies.map((policyStatement) => ({
    ...replaceEnvWithRef(policyStatement),
    Effect: policyStatement.Effect || 'Allow',
  }));
}

function replaceEnvWithRef(policy: CustomIAMPolicy): CustomIAMPolicy {
  const resource = policy.Resource.map((resource) =>
    typeof resource === 'string' && resource.includes('${env}') ? Fn.Sub(resource, { env: Fn.Ref('env') }) : resource,
  ) as any[];
  policy.Resource = resource;
  return policy;
}

function validateCustomPolicies(data: CustomIAMPolicies, categoryName: string, resourceName: string) {
  const ajv = new Ajv();
  //validate if the policies match the custom IAM policies schema, if not, then not write into the CFN template
  const validatePolicy = ajv.compile(CustomIAMPoliciesSchema);
  const valid = validatePolicy(data);
  if (!valid) {
    printer.error(`${resourceName} ${categoryName} custom-policies.json failed validation:`);
    formatter.list((validatePolicy?.errors || []).map((err) => `${err.dataPath} ${err.message}`));
    throw new CustomPoliciesFormatError(`
      Invalid custom IAM policies for ${resourceName} ${categoryName}.
      See details above and fix errors in <project-dir>/amplify/backend/${categoryName}/${resourceName}/custom-policies.json.
      Learn more about custom IAM policies: https://docs.amplify.aws/cli/function/#access-existing-aws-resource-from-lambda-function
    `);
  }

  for (const customPolicy of data) {
    const resources = customPolicy.Resource;
    const actions = customPolicy.Action;
    const resourceRegex = new RegExp(
      'arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:(([a-z]{2}|\\*)(-gov)?-[a-z-*]+-(\\d{1}|\\*)|\\*)?:(\\d{12}|\\*)?:(.*)',
    );
    const actionRegex = new RegExp('[a-zA-Z0-9]+:[a-z|A-Z|0-9|*]+');
    const wrongResourcesRegex: string[] = [];
    const wrongActionsRegex: string[] = [];
    let errorMessage = '';

    for (const resource of resources) {
      if (typeof resource !== 'string') {
        continue;
      }

      if (!(resourceRegex.test(resource) || resource === '*')) {
        wrongResourcesRegex.push(resource);
      }
    }

    for (const action of actions) {
      if (!actionRegex.test(action)) {
        wrongActionsRegex.push(action);
      }
    }

    const customPoliciesPath = pathManager.getCustomPoliciesPath(categoryName, resourceName);

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
}

function resourceHasCustomPolicies(customPolicies: CustomIAMPolicies): boolean {
  const customPolicy = _.first(customPolicies);

  // if either there are no custom policies in the array or the defined policy is the default
  if (!customPolicy || (customPolicy && customPolicy.Action?.length === 0 && customPolicy.Resource.length == 0)) {
    return false;
  }

  return true;
}

function warnWildcardCustomPoliciesResource(customPolicies: CustomIAMPolicy[], resourceName: string) {
  customPolicies
    .filter((policy) => policy.Resource.includes('*'))
    .forEach((policy) =>
      printer.warn(
        `Warning: You've specified "*" as the "Resource" in ${resourceName}'s custom IAM policy.\n This will grant ${resourceName} the ability to perform ${policy.Action} on ALL resources in this AWS Account.`,
      ),
    );
}

function applyCustomPolicyToLambda(generatedCustomPolicies: CustomIAMPolicies, cfnTemplate: Template): Template {
  const policy = new IAM.Policy({
    PolicyName: 'custom-lambda-execution-policy',
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: generatedCustomPolicies,
    },
    Roles: [Fn.Ref('LambdaExecutionRole')],
  });
  policy.dependsOn('LambdaExecutionRole');
  _.setWith(cfnTemplate, ['Resources', 'CustomLambdaExecutionPolicy'], policy);

  return cfnTemplate;
}

function applyCustomPolicyToElasticContainers(generatedCustomPolicies: CustomIAMPolicies, cfnTemplate: Template): Template {
  const taskRoleArn = _.get(cfnTemplate, ['Resources', 'TaskDefinition', 'Properties', 'TaskRoleArn', 'Fn::GetAtt']);
  if (!taskRoleArn) {
    printer.warn('Cannot apply custom policies could not find Task Role');
    return cfnTemplate;
  }
  const policy = new IAM.Policy({
    PolicyDocument: {
      Statement: generatedCustomPolicies,
      Version: '2012-10-17',
    },
    PolicyName: 'CustomExecutionPolicyForContainer',
    Roles: [Fn.Ref(taskRoleArn[0])],
  });
  _.setWith(cfnTemplate, ['Resources', 'CustomExecutionPolicyForContainer'], policy);
  return cfnTemplate;
}
