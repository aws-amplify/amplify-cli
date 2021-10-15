import { Fn, IAM } from 'cloudform-types';
import { JSONUtilities, pathManager } from '.';

export type CustomIAMPolicies = CustomIAMPolicy[];

export type CustomIAMPolicy = {
    Action: string[];
    Effect: string;
    Resource: string[];
}

export const CustomIAMPoliciesSchema = {
  type : 'array',
  minItems: 1,
  items: {
    type: 'object',
    properties: {
      Action: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: false },
      Resource: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: false }
    },
    optionalProperties: {
      Effect: { type: 'string', enum:['Allow', 'Deny'], default: 'Allow' },
    },
    required: ['Resource', 'Action'],
    additionalProperties: true
  },
  additionalProperties: false
}

export const customExecutionPolicyForFunction = new IAM.Policy({
    PolicyName: 'custom-lambda-execution-policy',
    Roles: [
      Fn.Ref('LambdaExecutionRole')
    ],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: []
    }
  }).dependsOn(['LambdaExecutionRole']);

export const customExecutionPolicyForContainer = new IAM.Policy({
    PolicyDocument: {
        Statement: [
        ],
        Version: '2012-10-17'
    },
    PolicyName: 'CustomExecutionPolicyForContainer',
    Roles: [
    ]
  });

export function createDefaultCustomPoliciesFile(categoryName: string, resourceName: string) {
  const customPoliciesPath = pathManager.getCustomPoliciesPath(categoryName, resourceName);
  const defaultCustomPolicies = [
    {
      Action: [],
      Resource: []
    }
  ]
  JSONUtilities.writeJson(customPoliciesPath, defaultCustomPolicies);
}



