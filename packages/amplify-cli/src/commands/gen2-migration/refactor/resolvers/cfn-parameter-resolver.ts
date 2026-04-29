import { Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNTemplate, CFN_PSEUDO_PARAMETERS_REF } from '../../_infra/cfn-template';
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

/**
 * Transforms NoEcho parameters in a CloudFormation-bound Parameters array to use
 * UsePreviousValue instead of the masked ParameterValue returned by DescribeStacks.
 *
 * Background: DescribeStacks masks NoEcho parameter values as "****". Passing that
 * masked value back to CreateChangeSet / UpdateStack causes CloudFormation to treat
 * it as an explicit new value. For templates that reference the NoEcho parameter
 * via {Ref: <paramKey>} inside a Custom::LambdaCallout's Properties, this re-resolves
 * the Ref to the literal string "****", triggers a Custom resource update, and crashes
 * the Lambda when it JSON.parses the masked token.
 *
 * The fix: for each parameter whose template declaration has NoEcho: true, send
 * { ParameterKey, UsePreviousValue: true } — CloudFormation uses the real stored
 * value internally and the masked "****" never flows through the template.
 *
 * Non-NoEcho parameters pass through unchanged.
 */
export function resolveNoEchoParameters(template: CFNTemplate, parameters: Parameter[]): Parameter[] {
  const templateParams = template.Parameters ?? {};
  return parameters.map((param) => {
    if (!param.ParameterKey) return param;
    const paramDef = templateParams[param.ParameterKey];
    if (paramDef?.NoEcho) {
      return { ParameterKey: param.ParameterKey, UsePreviousValue: true };
    }
    return param;
  });
}
