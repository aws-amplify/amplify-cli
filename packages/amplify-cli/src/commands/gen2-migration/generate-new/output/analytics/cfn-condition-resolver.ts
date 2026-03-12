import { Parameter } from '@aws-sdk/client-cloudformation';
import { CFNFunction } from '../../../cfn-template';

/**
 * Resolves conditions in a parsed CloudFormation template using deployed
 * stack parameters.
 *
 * Evaluates Fn::Equals, Fn::Not, Fn::Or, Fn::And conditions and removes
 * resources whose conditions are not met. Also resolves Fn::If in resource
 * properties.
 *
 * The template is untyped JSON from JSON.parse() — no compile-time
 * guarantees on its shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class CFNConditionResolver {
  private readonly conditions: Record<string, any> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(private readonly template: any) {
    this.conditions = template.Conditions;
  }

  /**
   * Resolves all conditions and returns a new template with unmet-condition resources removed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public resolve(parameters: Parameter[]): any {
    if (!this.conditions || Object.keys(this.conditions).length === 0) return this.template;

    const clonedTemplate = JSON.parse(JSON.stringify(this.template));
    const conditionValueMap = new Map<string, boolean>();
    for (const [conditionKey, conditionValue] of Object.entries(this.conditions)) {
      const fnType = Object.keys(conditionValue)[0];
      if (Object.values(CFNFunction).includes(fnType as CFNFunction)) {
        const conditionStatements = conditionValue[fnType];
        const [leftStatement, rightStatement] = conditionStatements;
        const result = this.resolveCondition(leftStatement, rightStatement, parameters, fnType as CFNFunction);
        conditionValueMap.set(conditionKey, result);
      }
    }

    this.resolveConditionInResources(clonedTemplate.Resources, conditionValueMap);

    return clonedTemplate;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolveCondition(leftStatement: any, rightStatement: any, params: Parameter[], fnType: CFNFunction): boolean {
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
      const nestedCondition = this.conditions[leftStatement.Condition];
      const nestedFnType = Object.keys(nestedCondition)[0] as CFNFunction;
      const [nestedLeft, nestedRight] = nestedCondition[nestedFnType];
      resolvedLeftStatement = this.resolveCondition(nestedLeft, nestedRight, params, nestedFnType);
    }
    if (typeof rightStatement === 'object' && 'Condition' in rightStatement) {
      const nestedCondition = this.conditions[rightStatement.Condition];
      const nestedFnType = Object.keys(nestedCondition)[0] as CFNFunction;
      const [nestedLeft, nestedRight] = nestedCondition[nestedFnType];
      resolvedRightStatement = this.resolveCondition(nestedLeft, nestedRight, params, nestedFnType);
    }

    // Resolve nested function expressions
    if (typeof leftStatement === 'object' && Object.values(CFNFunction).includes(Object.keys(leftStatement)[0] as CFNFunction)) {
      const nestedFnType = Object.keys(leftStatement)[0] as CFNFunction;
      const [nestedLeft, nestedRight] = leftStatement[nestedFnType];
      resolvedLeftStatement = this.resolveCondition(nestedLeft, nestedRight, params, nestedFnType);
    }
    if (typeof rightStatement === 'object' && Object.values(CFNFunction).includes(Object.keys(rightStatement)[0] as CFNFunction)) {
      const nestedFnType = Object.keys(rightStatement)[0] as CFNFunction;
      const [nestedLeft, nestedRight] = rightStatement[nestedFnType];
      resolvedRightStatement = this.resolveCondition(nestedLeft, nestedRight, params, nestedFnType);
    }

    // Resolve parameter refs
    if (typeof leftStatement === 'object' && 'Ref' in leftStatement) {
      const value = params.find((p) => p.ParameterKey === leftStatement.Ref)?.ParameterValue;
      if (!value) {
        throw new Error(`Could not resolve parameter ref: ${leftStatement.Ref}`);
      }
      resolvedLeftStatement = value;
    }
    if (rightStatement && typeof rightStatement === 'object' && 'Ref' in rightStatement) {
      const value = params.find((p) => p.ParameterKey === rightStatement.Ref)?.ParameterValue;
      if (!value) {
        throw new Error(`Could not resolve parameter ref: ${rightStatement.Ref}`);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolveConditionInResources(resources: Record<string, any>, conditionValueMap: Map<string, boolean>): void {
    for (const [logicalId, value] of Object.entries(resources)) {
      if (value.Condition && conditionValueMap.has(value.Condition)) {
        if (!conditionValueMap.get(value.Condition)) {
          delete resources[logicalId];
          continue;
        }
      }
      const props = value.Properties;
      if (!props) continue;
      for (const [propName, propValue] of Object.entries(props)) {
        if (typeof propValue === 'object' && propValue !== null) {
          props[propName] = this.resolveIfCondition(propValue, conditionValueMap);
        }
      }
    }
  }

  private resolveIfCondition(propValue: object, conditionValueMap: Map<string, boolean>): object {
    if (CFNFunction.If in propValue) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ifCondition = (propValue as any)[CFNFunction.If] as [string, object, object];
      const conditionName = ifCondition[0];
      if (conditionValueMap.has(conditionName)) {
        return conditionValueMap.get(conditionName) ? ifCondition[1] : ifCondition[2];
      }
    }
    return propValue;
  }
}
