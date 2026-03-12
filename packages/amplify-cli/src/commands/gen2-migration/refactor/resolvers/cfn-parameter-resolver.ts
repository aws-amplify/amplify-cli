import { Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNTemplate, CFN_PSEUDO_PARAMETERS_REF } from '../cfn-template';
import { walkCfnTree } from './cfn-tree-walker';

/**
 * Resolves parameter references in a CloudFormation template by tree-walking.
 * Returns a new template; does not mutate input.
 *
 * Finds {"Ref": "ParamKey"} nodes and replaces them with the parameter's runtime value.
 * Handles CommaDelimitedList/List<Number> (split into arrays), NoEcho (skipped),
 * and AWS::StackName pseudo-parameter (when stackName is provided).
 *
 * Operates on the entire template (Resources, Outputs, Conditions, etc.).
 */
export function resolveParameters(template: CFNTemplate, parameters: Parameter[], stackName?: string): CFNTemplate {
  if (!parameters.length && !stackName) return template;

  const templateParams = template.Parameters ?? {};

  // Build a lookup of parameter key → resolved value.
  // The resolved value is already the final replacement (string, array, etc.).
  const paramMap = new Map<string, unknown>();

  if (stackName) {
    paramMap.set(CFN_PSEUDO_PARAMETERS_REF.StackName, stackName);
  }

  for (const { ParameterKey, ParameterValue } of parameters) {
    if (!ParameterKey) {
      throw new AmplifyError('MissingExpectedParameterError', {
        message: 'Encountered a stack parameter with no ParameterKey',
      });
    }
    if (!ParameterValue) continue;

    const paramDef = templateParams[ParameterKey];
    if (!paramDef) continue;
    if (paramDef.NoEcho) continue;

    const isListType = paramDef.Type === 'CommaDelimitedList' || paramDef.Type === 'List<Number>';
    const resolved = isListType ? (ParameterValue.includes(',') ? ParameterValue.split(',') : [ParameterValue]) : ParameterValue;

    paramMap.set(ParameterKey, resolved);
  }

  if (paramMap.size === 0) return template;

  return walkCfnTree(template, (node) => {
    if ('Ref' in node && typeof node.Ref === 'string' && Object.keys(node).length === 1) {
      const value = paramMap.get(node.Ref);
      if (value !== undefined) return value;
    }
    return undefined;
  }) as CFNTemplate;
}
