import { CFNConditionFunction, CFNConditionFunctionStatement, CFNFunction, CFNResource, CFNTemplate } from '../types';
import assert from 'node:assert';
import { Parameter } from '@aws-sdk/client-cloudformation';

/**
 * Class to resolve conditions in a CloudFormation template.
 * This is needed prior to a stack refactor since same conditions and params are not present in Gen1 and Gen2 stacks
 * and the resource being moved needs to have its condition resolved.
 */
class CFNConditionResolver {
  private readonly conditions: Record<string, CFNConditionFunction> | undefined;
  constructor(private readonly template: CFNTemplate) {
    this.conditions = template.Conditions;
  }

  public resolve(parameters: Parameter[]) {
    if (!this.conditions || Object.keys(this.conditions).length === 0) return this.template;

    const clonedGen1Template = JSON.parse(JSON.stringify(this.template)) as CFNTemplate;
    const conditionValueMap = new Map<string, boolean>();
    Object.entries(this.conditions).forEach(([conditionKey, conditionValue]) => {
      const fnType = Object.keys(conditionValue)[0];
      if (Object.values(CFNFunction).includes(fnType as CFNFunction)) {
        const conditionStatements = conditionValue[fnType as keyof CFNConditionFunction];
        const [leftStatement, rightStatement] = conditionStatements as [CFNConditionFunctionStatement, CFNConditionFunctionStatement];
        const result = this.resolveCondition(leftStatement, rightStatement, parameters, fnType as CFNFunction);
        conditionValueMap.set(conditionKey, result);
      }
    });

    this.resolveConditionInResources(clonedGen1Template.Resources, conditionValueMap);

    return clonedGen1Template;
  }

  private resolveCondition(
    leftStatement: CFNConditionFunctionStatement,
    rightStatement: CFNConditionFunctionStatement,
    params: Parameter[],
    fnType: CFNFunction,
  ): boolean {
    assert(this.conditions);
    let resolvedLeftStatement: boolean | string | undefined;
    let resolvedRightStatement: boolean | string | undefined;

    if (typeof leftStatement !== 'object') {
      resolvedLeftStatement = leftStatement;
    }
    if (typeof rightStatement !== 'object') {
      resolvedRightStatement = rightStatement;
    }
    // Resolve nested condition
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

    // Resolve nested function
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
      const parameterKey = leftStatement.Ref;
      const value = params.find((p) => p.ParameterKey === parameterKey)?.ParameterValue;
      assert(value);
      resolvedLeftStatement = value;
    }
    if (rightStatement && typeof rightStatement === 'object' && 'Ref' in rightStatement) {
      const parameterKey = rightStatement.Ref;
      const value = params.find((p) => p.ParameterKey === parameterKey)?.ParameterValue;
      assert(value);
      resolvedRightStatement = value;
    }

    let result: boolean | undefined;
    switch (fnType) {
      case CFNFunction.Equals:
        result = resolvedLeftStatement === resolvedRightStatement;
        break;
      case CFNFunction.Not:
        result = !resolvedLeftStatement;
        break;
      case CFNFunction.Or:
        result = !!(resolvedLeftStatement || resolvedRightStatement);
        break;
      case CFNFunction.And:
        result = !!(resolvedLeftStatement && resolvedRightStatement);
        break;
      default:
        throw new Error(`Invalid ${fnType} condition`);
    }
    assert(result !== undefined);
    return result;
  }

  private resolveConditionInResources(resources: Record<string, CFNResource>, conditionValueMap: Map<string, boolean>) {
    Object.entries(resources).forEach(([logicalId, value]) => {
      const condition = value.Condition;
      if (condition && conditionValueMap.has(condition)) {
        const result = conditionValueMap.get(condition);
        // delete resources from template that have unmet condition
        if (!result) {
          delete resources[logicalId];
        }
      }
      const props = value.Properties;
      Object.entries(props).forEach(([propName, propValue]) => {
        if (typeof propValue === 'object') {
          props[propName] = this.resolveIfCondition(propValue, conditionValueMap);
        } else if (Array.isArray(propValue)) {
          propValue.forEach((item, index) => {
            if (typeof item === 'object') {
              propValue[index] = this.resolveIfCondition(item, conditionValueMap);
            }
          });
        }
      });
    });
    return resources;
  }

  private resolveIfCondition(propValue: object, conditionValueMap: Map<string, boolean>) {
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
