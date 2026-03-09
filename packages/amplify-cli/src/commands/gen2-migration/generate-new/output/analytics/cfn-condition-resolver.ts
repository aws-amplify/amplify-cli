import { Parameter } from '@aws-sdk/client-cloudformation';

/**
 * CloudFormation intrinsic function names used in condition expressions.
 */
export enum CFNFunction {
  Equals = 'Fn::Equals',
  Not = 'Fn::Not',
  Or = 'Fn::Or',
  And = 'Fn::And',
  If = 'Fn::If',
}

/**
 * A condition reference inside a CloudFormation condition expression.
 */
export type CFNIntrinsicFunctionCondition = {
  readonly Condition: string;
};

/**
 * A single operand in a CloudFormation condition function.
 */
export type CFNConditionFunctionStatement = string | object | CFNConditionFunction | CFNIntrinsicFunctionCondition;

/**
 * A CloudFormation condition function (Fn::Equals, Fn::Not, etc.).
 */
export type CFNConditionFunction =
  | { [CFNFunction.Equals]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] }
  | { [CFNFunction.Not]: [CFNConditionFunctionStatement] }
  | { [CFNFunction.Or]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] }
  | { [CFNFunction.And]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] };

/**
 * A CloudFormation resource definition.
 */
export interface CFNResource {
  readonly Type: string;
  readonly Properties: Record<string, string | number | object>;
  readonly DependsOn?: string | string[];
  readonly Condition?: string;
}

/**
 * A CloudFormation parameter definition.
 */
export interface CFNParameter {
  readonly Type: string;
  readonly Default?: string;
  readonly Description?: string;
  readonly NoEcho?: boolean;
}

/**
 * A CloudFormation template structure.
 */
export interface CFNTemplate {
  readonly Description: string;
  readonly AWSTemplateFormatVersion: string;
  Conditions?: Record<string, CFNConditionFunction>;
  Resources: Record<string, CFNResource>;
  Parameters?: Record<string, CFNParameter>;
  readonly Outputs: Record<string, { readonly Description?: string; readonly Value: string | object }>;
}

/**
 * Resolves conditions in a CloudFormation template using deployed stack parameters.
 *
 * Evaluates Fn::Equals, Fn::Not, Fn::Or, Fn::And conditions and removes
 * resources whose conditions are not met. Also resolves Fn::If in resource
 * properties.
 */
class CFNConditionResolver {
  private readonly conditions: Record<string, CFNConditionFunction> | undefined;

  public constructor(private readonly template: CFNTemplate) {
    this.conditions = template.Conditions;
  }

  public resolve(parameters: Parameter[]): CFNTemplate {
    if (!this.conditions || Object.keys(this.conditions).length === 0) return this.template;

    const clonedTemplate = JSON.parse(JSON.stringify(this.template)) as CFNTemplate;
    const conditionValueMap = new Map<string, boolean>();
    for (const [conditionKey, conditionValue] of Object.entries(this.conditions)) {
      const fnType = Object.keys(conditionValue)[0];
      if (Object.values(CFNFunction).includes(fnType as CFNFunction)) {
        const conditionStatements = conditionValue[fnType as keyof CFNConditionFunction];
        const [leftStatement, rightStatement] = conditionStatements as [CFNConditionFunctionStatement, CFNConditionFunctionStatement];
        const result = this.resolveCondition(leftStatement, rightStatement, parameters, fnType as CFNFunction);
        conditionValueMap.set(conditionKey, result);
      }
    }

    this.resolveConditionInResources(clonedTemplate.Resources, conditionValueMap);

    return clonedTemplate;
  }

  private resolveCondition(
    leftStatement: CFNConditionFunctionStatement,
    rightStatement: CFNConditionFunctionStatement,
    params: Parameter[],
    fnType: CFNFunction,
  ): boolean {
    if (!this.conditions) {
      throw new Error('Cannot resolve condition: template has no Conditions block');
    }

    let resolvedLeftStatement: boolean | string | undefined;
    let resolvedRightStatement: boolean | string | undefined;

    if (typeof leftStatement !== 'object') {
      resolvedLeftStatement = leftStatement;
    }
    if (typeof rightStatement !== 'object') {
      resolvedRightStatement = rightStatement;
    }

    // Resolve nested condition references
    if (typeof leftStatement === 'object' && 'Condition' in leftStatement) {
      const nestedConditionName = leftStatement.Condition;
      const nestedCondition = this.conditions[nestedConditionName];
      const nestedFnType = Object.keys(nestedCondition)[0] as CFNFunction;
      const [nestedLeftStatement, nestedRightStatement] = nestedCondition[nestedFnType as keyof CFNConditionFunction] as [
        CFNConditionFunctionStatement,
        CFNConditionFunctionStatement,
      ];
      resolvedLeftStatement = this.resolveCondition(nestedLeftStatement, nestedRightStatement, params, nestedFnType);
    }
    if (typeof rightStatement === 'object' && 'Condition' in rightStatement) {
      const nestedConditionName = rightStatement.Condition;
      const nestedCondition = this.conditions[nestedConditionName];
      const nestedFnType = Object.keys(nestedCondition)[0] as CFNFunction;
      const [nestedLeftStatement, nestedRightStatement] = nestedCondition[nestedFnType as keyof CFNConditionFunction] as [
        CFNConditionFunctionStatement,
        CFNConditionFunctionStatement,
      ];
      resolvedRightStatement = this.resolveCondition(nestedLeftStatement, nestedRightStatement, params, nestedFnType);
    }

    // Resolve nested function expressions
    if (typeof leftStatement === 'object' && Object.values(CFNFunction).includes(Object.keys(leftStatement)[0] as CFNFunction)) {
      const nestedCondition = leftStatement;
      const nestedFnType = Object.keys(nestedCondition)[0] as CFNFunction;
      const [nestedLeftStatement, nestedRightStatement] = nestedCondition[nestedFnType as keyof CFNConditionFunction] as [
        CFNConditionFunctionStatement,
        CFNConditionFunctionStatement,
      ];
      resolvedLeftStatement = this.resolveCondition(nestedLeftStatement, nestedRightStatement, params, nestedFnType);
    }
    if (typeof rightStatement === 'object' && Object.values(CFNFunction).includes(Object.keys(rightStatement)[0] as CFNFunction)) {
      const nestedCondition = rightStatement;
      const nestedFnType = Object.keys(nestedCondition)[0] as CFNFunction;
      const [nestedLeftStatement, nestedRightStatement] = nestedCondition[nestedFnType as keyof CFNConditionFunction] as [
        CFNConditionFunctionStatement,
        CFNConditionFunctionStatement,
      ];
      resolvedRightStatement = this.resolveCondition(nestedLeftStatement, nestedRightStatement, params, nestedFnType);
    }

    // Resolve parameter refs
    if (typeof leftStatement === 'object' && 'Ref' in leftStatement) {
      const parameterKey = (leftStatement as Record<string, string>).Ref;
      const value = params.find((p) => p.ParameterKey === parameterKey)?.ParameterValue;
      if (!value) {
        throw new Error(`Could not resolve parameter ref: ${parameterKey}`);
      }
      resolvedLeftStatement = value;
    }
    if (rightStatement && typeof rightStatement === 'object' && 'Ref' in rightStatement) {
      const parameterKey = (rightStatement as Record<string, string>).Ref;
      const value = params.find((p) => p.ParameterKey === parameterKey)?.ParameterValue;
      if (!value) {
        throw new Error(`Could not resolve parameter ref: ${parameterKey}`);
      }
      resolvedRightStatement = value;
    }

    switch (fnType) {
      case CFNFunction.Equals:
        return resolvedLeftStatement === resolvedRightStatement;
      case CFNFunction.Not:
        return !resolvedLeftStatement;
      case CFNFunction.Or:
        return !!(resolvedLeftStatement || resolvedRightStatement);
      case CFNFunction.And:
        return !!(resolvedLeftStatement && resolvedRightStatement);
      default:
        throw new Error(`Invalid ${fnType} condition`);
    }
  }

  private resolveConditionInResources(
    resources: Record<string, CFNResource>,
    conditionValueMap: Map<string, boolean>,
  ): Record<string, CFNResource> {
    for (const [logicalId, value] of Object.entries(resources)) {
      const condition = value.Condition;
      if (condition && conditionValueMap.has(condition)) {
        const result = conditionValueMap.get(condition);
        if (!result) {
          delete resources[logicalId];
        }
      }
      const props = value.Properties;
      for (const [propName, propValue] of Object.entries(props)) {
        if (typeof propValue === 'object') {
          props[propName] = this.resolveIfCondition(propValue, conditionValueMap);
        } else if (Array.isArray(propValue)) {
          propValue.forEach((item, index) => {
            if (typeof item === 'object') {
              propValue[index] = this.resolveIfCondition(item, conditionValueMap);
            }
          });
        }
      }
    }
    return resources;
  }

  private resolveIfCondition(propValue: object, conditionValueMap: Map<string, boolean>): object {
    let result = propValue;
    if (CFNFunction.If in propValue) {
      const ifCondition = propValue[CFNFunction.If] as [string, object, object];
      const conditionName = ifCondition[0];
      if (conditionValueMap.has(conditionName)) {
        const conditionValue = conditionValueMap.get(conditionName);
        result = conditionValue ? ifCondition[1] : ifCondition[2];
      }
    }
    return result;
  }
}

export default CFNConditionResolver;
