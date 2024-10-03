import { CFNTemplate } from '../types';
import { Parameter } from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';

class CfnParameterResolver {
  constructor(private readonly template: CFNTemplate) {}
  public resolve(parameters: Parameter[]) {
    if (!parameters.length) return this.template;
    let templateString = JSON.stringify(this.template);
    const parametersFromTemplate = this.template.Parameters;
    for (const { ParameterKey, ParameterValue } of parameters) {
      assert(ParameterKey);
      assert(ParameterValue);
      const { Type: parameterType, NoEcho } = parametersFromTemplate[ParameterKey];
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
    return JSON.parse(templateString);
  }
}

export default CfnParameterResolver;
