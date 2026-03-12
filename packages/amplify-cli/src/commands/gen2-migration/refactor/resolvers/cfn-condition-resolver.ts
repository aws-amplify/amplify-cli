import { Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNConditionFunction, CFNConditionFunctionStatement, CFNFunction, CFNTemplate } from '../../cfn-template';

/**
 * Resolves conditions in a CloudFormation template.
 * Returns a new template; does not mutate input.
 *
 * Three phases:
 * 1. Evaluate all Conditions → Map<string, boolean>
 * 2. Resolve top-level Fn::If in resource properties (non-recursive, matching old code scope)
 * 3. Remove resources with unmet conditions
 *
 * Fixes from old code:
 * - Array.isArray check before typeof === 'object' (old code had unreachable array branch)
 * - resolveStatement() helper eliminates triple copy-paste of left/right resolution
 */
export function resolveConditions(template: CFNTemplate, parameters: Parameter[]): CFNTemplate {
  const conditions = template.Conditions;
  if (!conditions || Object.keys(conditions).length === 0) return template;

  // Phase 1: Evaluate all conditions
  const conditionValues = new Map<string, boolean>();
  for (const [conditionKey, conditionDef] of Object.entries(conditions)) {
    const fnType = Object.keys(conditionDef)[0] as CFNFunction;
    if (!Object.values(CFNFunction).includes(fnType)) continue;

    const statements = conditionDef[fnType as keyof CFNConditionFunction] as CFNConditionFunctionStatement[];
    const [left, right] = statements;
    conditionValues.set(conditionKey, evaluateCondition(conditions, left, right, parameters, fnType));
  }

  // Phase 2: Resolve Fn::If only at the top level of resource properties (matching old code scope).
  // The old code does NOT recurse into nested objects — Fn::If inside Fn::Join etc. is left as-is.
  const resolved = JSON.parse(JSON.stringify(template)) as CFNTemplate;
  for (const [, resource] of Object.entries(resolved.Resources)) {
    for (const [propName, propValue] of Object.entries(resource.Properties)) {
      if (typeof propValue === 'object' && propValue !== null && !Array.isArray(propValue)) {
        resource.Properties[propName] = resolveIfCondition(propValue, conditionValues);
      } else if (Array.isArray(propValue)) {
        resource.Properties[propName] = propValue.map((item) =>
          typeof item === 'object' && item !== null ? resolveIfCondition(item, conditionValues) : item,
        );
      }
    }
  }

  // Phase 3: Remove resources with unmet conditions (mutates the walker's output, not the input)
  for (const [logicalId, resource] of Object.entries(resolved.Resources)) {
    const condition = resource.Condition;
    if (condition && conditionValues.has(condition) && !conditionValues.get(condition)) {
      delete resolved.Resources[logicalId];
    }
  }

  return resolved;
}

/**
 * Resolves a single condition function statement to a boolean or string value.
 * Handles: literal strings, nested conditions (Condition: "X"), nested functions
 * (Fn::Equals, etc.), and parameter refs (Ref: "X").
 */
function resolveStatement(
  conditions: Record<string, CFNConditionFunction>,
  statement: CFNConditionFunctionStatement,
  parameters: Parameter[],
): boolean | string {
  // Literal string
  if (typeof statement !== 'object') return statement;

  const record = statement as Record<string, unknown>;

  // Nested condition reference: { Condition: "ConditionName" }
  if ('Condition' in record) {
    const nestedName = record.Condition as string;
    const nestedDef = conditions[nestedName];
    const nestedFnType = Object.keys(nestedDef)[0] as CFNFunction;
    const nestedStatements = nestedDef[nestedFnType as keyof CFNConditionFunction] as CFNConditionFunctionStatement[];
    return evaluateCondition(conditions, nestedStatements[0], nestedStatements[1], parameters, nestedFnType);
  }

  // Nested function: { "Fn::Equals": [...] }, { "Fn::Not": [...] }, etc.
  const fnKey = Object.keys(record).find((k) => Object.values(CFNFunction).includes(k as CFNFunction));
  if (fnKey) {
    const nestedStatements = record[fnKey] as CFNConditionFunctionStatement[];
    return evaluateCondition(conditions, nestedStatements[0], nestedStatements[1], parameters, fnKey as CFNFunction);
  }

  // Parameter ref: { Ref: "ParamName" }
  if ('Ref' in record) {
    const paramKey = record.Ref as string;
    const value = parameters.find((p) => p.ParameterKey === paramKey)?.ParameterValue;
    if (value === undefined) {
      throw new AmplifyError('MissingExpectedParameterError', {
        message: `Condition references parameter '${paramKey}' but no value was provided`,
      });
    }
    return value;
  }

  throw new AmplifyError('CloudFormationTemplateError', {
    message: `Unsupported condition statement: ${JSON.stringify(statement)}`,
  });
}

/**
 * Evaluates a condition function (Fn::Equals, Fn::Not, Fn::Or, Fn::And) to a boolean.
 */
function evaluateCondition(
  conditions: Record<string, CFNConditionFunction>,
  left: CFNConditionFunctionStatement,
  right: CFNConditionFunctionStatement | undefined,
  parameters: Parameter[],
  fnType: CFNFunction,
): boolean {
  const resolvedLeft = resolveStatement(conditions, left, parameters);
  const resolvedRight = right !== undefined ? resolveStatement(conditions, right, parameters) : undefined;

  switch (fnType) {
    case CFNFunction.Equals:
      return resolvedLeft === resolvedRight;
    case CFNFunction.Not:
      return !resolvedLeft;
    case CFNFunction.Or:
      return !!(resolvedLeft || resolvedRight);
    case CFNFunction.And:
      return !!(resolvedLeft && resolvedRight);
    default:
      throw new AmplifyError('CloudFormationTemplateError', {
        message: `Unsupported condition function: ${fnType}`,
      });
  }
}

/**
 * Resolves a top-level Fn::If in a property value object.
 * Does NOT recurse — matches old code behavior.
 */
function resolveIfCondition(propValue: object, conditionValues: Map<string, boolean>): object {
  const record = propValue as Record<string, unknown>;
  if (CFNFunction.If in record) {
    const ifCondition = record[CFNFunction.If] as [string, unknown, unknown];
    const conditionName = ifCondition[0];
    if (conditionValues.has(conditionName)) {
      return (conditionValues.get(conditionName) ? ifCondition[1] : ifCondition[2]) as object;
    }
  }
  return propValue;
}
