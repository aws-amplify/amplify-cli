import { CFN_PSEUDO_PARAMETERS_REF, CFNTemplate, CFNParameter } from '../types';
import { Parameter } from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';

class CfnParameterResolver {
  constructor(private readonly template: CFNTemplate, private readonly stackName: string | undefined = undefined) {}

  public resolve(parameters: Parameter[]) {
    if (!parameters.length) return this.template;
    const clonedParameters = JSON.parse(JSON.stringify(parameters)) as Parameter[];
    const clonedGen1Template = JSON.parse(JSON.stringify(this.template)) as CFNTemplate;
    let templateString = JSON.stringify(clonedGen1Template);
    const parametersFromTemplate = this.template.Parameters;
    const clonedParametersFromTemplate = JSON.parse(JSON.stringify(parametersFromTemplate)) as Record<string, CFNParameter>;
    // This is required for Gen1 bucket name as it relies on Gen1 stack name, and we need to resolve
    // it before moving to Gen2 stack.
    if (this.stackName) {
      clonedParametersFromTemplate[CFN_PSEUDO_PARAMETERS_REF.StackName] = {
        Type: 'String',
      };
      clonedParameters.push({
        ParameterKey: CFN_PSEUDO_PARAMETERS_REF.StackName,
        ParameterValue: this.stackName,
      });
    }
    for (const { ParameterKey, ParameterValue } of clonedParameters) {
      assert(ParameterKey);
      if (!ParameterValue) continue;
      const { Type: parameterType, NoEcho } = clonedParametersFromTemplate[ParameterKey];
      if (NoEcho) continue;
      // All parameter values referenced by Ref are coerced to strings. List/Comma delimited are converted to arrays before coercing to string.
      // Ref: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
      let resolvedParameterValue: string = JSON.stringify(ParameterValue);
      const isListValue = parameterType === 'CommaDelimitedList' || parameterType === 'List<Number>';
      if (isListValue) {
        resolvedParameterValue = JSON.stringify(ParameterValue.includes(',') ? ParameterValue.split(',') : [ParameterValue]);
      }
      const paramRegexp = new RegExp(`{"Ref":"${ParameterKey}"}`, 'g');
      templateString = templateString.replaceAll(paramRegexp, resolvedParameterValue);
    }
    // remove stack name pseudo param from template
    if (this.stackName) {
      delete clonedParametersFromTemplate[CFN_PSEUDO_PARAMETERS_REF.StackName];
    }
    return JSON.parse(templateString);
  }
}

export default CfnParameterResolver;
