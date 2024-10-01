import { CloudFormationClient, DescribeStacksCommand, GetTemplateCommand, Stack, Parameter, Output } from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';
import {
  AWS_RESOURCE_ATTRIBUTES,
  CFN_CATEGORY_TYPE,
  CFN_RESOURCE_TYPES,
  CFNChangeTemplateWithParams,
  CFNConditionFunction,
  CFNFunction,
  CFNResource,
  CFNStackRefactorTemplates,
  CFNTemplate,
} from './types';

export class CategoryTemplateGenerator<CFNCategoryType extends CFN_CATEGORY_TYPE> {
  private gen1DescribeStacksResponse: Stack | undefined;
  private gen2DescribeStacksResponse: Stack | undefined;
  private gen1ResourcesToMove: Map<string, CFNResource>;
  private gen2ResourcesToRemove: Map<string, CFNResource>;
  constructor(
    private readonly gen1StackId: string,
    private readonly gen2StackId: string,
    private readonly region: string,
    private readonly accountId: string,
    private readonly cfnClient: CloudFormationClient,
    private readonly resourcesToMove: CFNCategoryType[],
    private readonly resourcesToMovePredicate?: (resourcesToMove: CFN_CATEGORY_TYPE[], resourceEntry: [string, CFNResource]) => boolean,
  ) {
    this.gen1ResourcesToMove = new Map();
    this.gen2ResourcesToRemove = new Map();
  }

  async readTemplate(stackId: string) {
    const getTemplateResponse = await this.cfnClient.send(
      new GetTemplateCommand({
        StackName: stackId,
      }),
    );
    const templateBody = getTemplateResponse.TemplateBody;
    assert(templateBody);
    return JSON.parse(templateBody) as CFNTemplate;
  }

  async describeStack(stackId: string) {
    return (
      await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackId,
        }),
      )
    ).Stacks?.[0];
  }

  public async describeGen1Stack() {
    this.gen1DescribeStacksResponse = await this.describeStack(this.gen1StackId);
    assert(this.gen1DescribeStacksResponse);
    return this.gen1DescribeStacksResponse;
  }

  public async describeGen2Stack() {
    this.gen2DescribeStacksResponse = await this.describeStack(this.gen2StackId);
    assert(this.gen2DescribeStacksResponse);
    return this.gen2DescribeStacksResponse;
  }

  public readGen1Template() {
    return this.readTemplate(this.gen1StackId);
  }

  public async readGen2Template() {
    return this.readTemplate(this.gen2StackId);
  }

  async generateGen1PreProcessTemplate(): Promise<CFNChangeTemplateWithParams> {
    const { Parameters, Outputs } = await this.describeGen1Stack();
    assert(Parameters);
    assert(Outputs);
    const oldGen1Template = await this.readGen1Template();
    this.gen1ResourcesToMove = new Map(
      Object.entries(oldGen1Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    const logicalResourceIds = [...this.gen1ResourcesToMove.keys()];
    const gen1ParametersResolvedTemplate = this.resolveGen1ParametersForRefactor(oldGen1Template);
    const gen1TemplateWithOutputsResolved = this.resolveRefs(logicalResourceIds, gen1ParametersResolvedTemplate, Outputs);
    const gen1TemplateWithDepsResolved = this.resolveGen1DependenciesInRefactor(gen1TemplateWithOutputsResolved, logicalResourceIds);
    const gen1TemplateWithConditionsResolved = this.resolveGen1Conditions(gen1TemplateWithDepsResolved);
    return {
      oldTemplate: oldGen1Template,
      newTemplate: gen1TemplateWithConditionsResolved,
      params: Parameters,
    };
  }

  async generateGen2ResourceRemovalTemplate(): Promise<CFNChangeTemplateWithParams> {
    const { Parameters } = await this.describeGen2Stack();
    const oldGen2Template = await this.readGen2Template();
    this.gen2ResourcesToRemove = new Map(
      Object.entries(oldGen2Template.Resources).filter(([, value]) =>
        this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type),
      ),
    );
    const updatedGen2Template = this.removeGen2Resources(oldGen2Template, [...this.gen2ResourcesToRemove.keys()]);
    return {
      oldTemplate: oldGen2Template,
      newTemplate: updatedGen2Template,
      params: Parameters,
    };
  }

  generateStackRefactorTemplates(gen1Template: CFNTemplate, gen2Template: CFNTemplate): Promise<CFNStackRefactorTemplates> {
    return this.generateRefactorTemplates(this.gen1ResourcesToMove, this.gen2ResourcesToRemove, gen1Template, gen2Template);
  }

  public resolveStackOutputs(stackTemplate: CFNTemplate, stackOutputs: Output[]) {
    const clonedStackTemplate = JSON.parse(JSON.stringify(stackTemplate));
    const outputs = clonedStackTemplate.Outputs;
    if (outputs) {
      Object.keys(outputs).forEach((outputKey) => {
        const outputValue = stackOutputs.find((output) => output.OutputKey === outputKey)?.OutputValue;
        assert(outputValue);
        outputs[outputKey].Value = outputValue;
      });
    }
    return clonedStackTemplate;
  }

  public resolveGen1Conditions(gen1Template: CFNTemplate) {
    const describeStackResponse = this.gen1DescribeStacksResponse;
    assert(describeStackResponse);

    const clonedGen1Template = JSON.parse(JSON.stringify(gen1Template)) as CFNTemplate;
    const conditions = clonedGen1Template.Conditions;
    if (!conditions) return clonedGen1Template;

    const params = describeStackResponse.Parameters;
    assert(params);
    const conditionValueMap = new Map<string, boolean>();
    Object.entries(conditions).forEach(([conditionKey, conditionValue]) => {
      const fnType = Object.keys(conditionValue)[0];
      if (Object.values(CFNFunction).includes(fnType as CFNFunction)) {
        const conditionStatements = conditionValue[fnType as keyof CFNConditionFunction];
        const [leftStatement, rightStatement] = conditionStatements as [any, any];
        const result = this.resolveCondition(leftStatement, rightStatement, params, fnType as CFNFunction);
        conditionValueMap.set(conditionKey, result);
      }
    });

    this.resolveConditionInResources(clonedGen1Template.Resources, conditionValueMap);

    return clonedGen1Template;
  }

  private resolveCondition(leftStatement: any, rightStatement: any, params: Parameter[], fnType: CFNFunction) {
    let resolvedLeftStatement = leftStatement;
    let resolvedRightStatement = rightStatement;

    if (typeof leftStatement === 'object' && 'Ref' in leftStatement) {
      const parameterKey = leftStatement.Ref;
      resolvedLeftStatement = params.find((p) => p.ParameterKey === parameterKey)?.ParameterValue;
      assert(resolvedLeftStatement);
    }
    if (rightStatement && rightStatement === 'object' && 'Ref' in rightStatement) {
      const parameterKey = rightStatement.Ref;
      resolvedRightStatement = params.find((p) => p.ParameterKey === parameterKey)?.ParameterValue;
      assert(resolvedRightStatement);
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
        result = resolvedLeftStatement || resolvedRightStatement;
        break;
      case CFNFunction.And:
        result = resolvedLeftStatement && resolvedRightStatement;
        break;
      case CFNFunction.If: {
        throw new Error('Fn::If not allowed inside Conditions section');
      }
    }
    assert(result !== undefined);
    return result;
  }

  public resolveConditionInResources(resources: Record<string, CFNResource>, conditionValueMap: Map<string, boolean>) {
    Object.entries(resources).forEach(([, value]) => {
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

  public resolveIfCondition(propValue: any, conditionValueMap: Map<string, boolean>) {
    let result = propValue;
    if (CFNFunction.If in propValue) {
      const ifCondition = propValue[CFNFunction.If];
      const conditionName = ifCondition[0];
      if (conditionValueMap.has(conditionName)) {
        const conditionValue = conditionValueMap.get(conditionName);
        result = conditionValue ? ifCondition[1] : ifCondition[2];
      }
    }
    return result;
  }

  private resolveGen1ParametersForRefactor(gen1Template: CFNTemplate) {
    const gen1DescribeStacksResponse = this.gen1DescribeStacksResponse;
    const gen1StackParameters = gen1DescribeStacksResponse?.Parameters;
    const gen1StackParametersFromTemplate = gen1Template.Parameters;
    let gen1TemplateString = JSON.stringify(gen1Template);
    if (gen1StackParameters) {
      for (const { ParameterKey, ParameterValue } of gen1StackParameters) {
        if (!ParameterKey || !ParameterValue) {
          continue;
        }
        const { Type: parameterType, NoEcho } = gen1StackParametersFromTemplate[ParameterKey];
        if (NoEcho) continue;
        // All parameter values referenced by Ref are coerced to strings. List/Comma delimited are converted to arrays before coercing to string.
        // Ref (no pun intended): https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
        let resolvedParameterValue: string = JSON.stringify(ParameterValue);
        const isListValue = parameterType === 'CommaDelimitedList' || parameterType === 'List<Number>';
        if (isListValue) {
          resolvedParameterValue = JSON.stringify(ParameterValue.includes(',') ? ParameterValue.split(',') : [ParameterValue]);
        }
        const paramRegexp = new RegExp(`{"Ref":"${ParameterKey}"}`, 'g');
        gen1TemplateString = gen1TemplateString.replaceAll(paramRegexp, resolvedParameterValue);
      }
    }
    return JSON.parse(gen1TemplateString);
  }

  public removeGen1ResourcesFromGen1Stack(gen1Template: CFNTemplate, resourcesToRefactor: string[]) {
    const resources = gen1Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      delete resources[resourceToRefactor];
    }
    return gen1Template;
  }

  public addGen1ResourcesToGen2Stack(
    resolvedGen1Template: CFNTemplate,
    resourcesToRefactor: string[],
    gen1ToGen2ResourceLogicalIdMapping: Map<string, string>,
    gen2Template: CFNTemplate,
  ) {
    const resources = gen2Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      const gen2ResourceLogicalId = gen1ToGen2ResourceLogicalIdMapping.get(resourceToRefactor);
      assert(gen2ResourceLogicalId);
      resources[gen2ResourceLogicalId] = resolvedGen1Template.Resources[resourceToRefactor];
    }
    return gen2Template;
  }

  public resolveGen1DependenciesInRefactor(gen1Template: CFNTemplate, resourcesToRefactor: string[]) {
    const clonedGen1Template = JSON.parse(JSON.stringify(gen1Template)) as CFNTemplate;
    const resources = clonedGen1Template.Resources;
    Object.entries(resources).forEach(([logicalResourceId, resource]) => {
      if (resource?.DependsOn) {
        const deps = resource.DependsOn;
        const depsInRefactor = deps.filter((dep: string) => resourcesToRefactor.includes(dep));
        // If resource is not part of refactor, it should not depend on any resource being moved as part of refactor.
        if (depsInRefactor.length > 0 && !resourcesToRefactor.includes(logicalResourceId)) {
          resource.DependsOn = deps.filter((dep: string) => !resourcesToRefactor.includes(dep));
        }
        // If resource is part of refactor, it should only depend on resources being moved as part of refactor.
        else if (resourcesToRefactor.includes(logicalResourceId) && deps.length > depsInRefactor.length) {
          resource.DependsOn = depsInRefactor;
        }
      }
    });
    return clonedGen1Template;
  }

  public resolveRefs(logicalResourceIds: string[], stackTemplate: CFNTemplate, stackOutputs: Output[]): CFNTemplate {
    const resources = stackTemplate?.Resources;
    assert(resources);
    let stackTemplateString = JSON.stringify(stackTemplate);
    const stackTemplateOutputs = stackTemplate?.Outputs;
    assert(stackOutputs);
    assert(stackTemplateOutputs);

    for (const logicalResourceId of logicalResourceIds) {
      Object.entries(stackTemplateOutputs).forEach(([outputKey, outputValue]) => {
        const value = outputValue.Value;
        const stackOutputValue = stackOutputs?.find((op) => op.OutputKey === outputKey)?.OutputValue;
        assert(stackOutputValue);
        if (typeof value === 'object' && 'Ref' in value && value.Ref === logicalResourceId) {
          const outputRegexp = new RegExp(`{"Ref":"${logicalResourceId}"}`, 'g');
          stackTemplateString = stackTemplateString.replaceAll(outputRegexp, `"${stackOutputValue}"`);
        }
        const fnGetAttRegExp = new RegExp(`{"Fn::GetAtt":\\["${logicalResourceId}","(?<AttributeName>\\w+)"]}`, 'g');
        const fnGetAttRegExpResult = stackTemplateString.matchAll(fnGetAttRegExp).next();
        const resourceType = stackTemplate.Resources[logicalResourceId].Type as CFN_RESOURCE_TYPES;
        if (!fnGetAttRegExpResult.done) {
          const attributeName = fnGetAttRegExpResult.value.groups?.AttributeName;
          assert(attributeName);
          const resource = this.getResourceAttribute(attributeName as AWS_RESOURCE_ATTRIBUTES, resourceType, stackOutputValue);
          stackTemplateString = stackTemplateString.replaceAll(fnGetAttRegExp, this.buildFnGetAttReplace(resource));
        }
      });
    }

    return JSON.parse(stackTemplateString);
  }

  private getResourceAttribute(attributeName: AWS_RESOURCE_ATTRIBUTES, resourceType: CFN_RESOURCE_TYPES, resourceIdentifier: string) {
    switch (attributeName) {
      case 'Arn': {
        switch (resourceType) {
          case 'AWS::S3::Bucket':
            return {
              Arn: `arn:aws:s3:::${resourceIdentifier}`,
            };
          case 'AWS::Cognito::UserPool':
            return {
              Arn: `arn:aws:cognito-idp:${this.region}:${this.accountId}:userpool/${resourceIdentifier}`,
            };
          default:
            throw new Error(`getResourceAttribute not implemented for ${resourceType}`);
        }
      }
      default:
        throw new Error(`getResourceAttribute not implemented for ${attributeName}`);
    }
  }

  private buildFnGetAttReplace(record: Record<string, any>) {
    return (_match: string, _p1: string, _offset: number, _text: string, groups: Record<string, string>) =>
      `"${record[groups.AttributeName]}"`;
  }

  public buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourceMap: Map<string, CFNResource>, gen2ResourceMap: Map<string, CFNResource>) {
    const gen1ToGen2ResourceLogicalIdMapping = new Map<string, string>();
    for (const [gen1ResourceLogicalId, gen1Resource] of gen1ResourceMap) {
      for (const [gen2ResourceLogicalId, gen2Resource] of gen2ResourceMap) {
        if (gen2Resource.Type !== gen1Resource.Type) {
          continue;
        }
        gen1ToGen2ResourceLogicalIdMapping.set(gen1ResourceLogicalId, gen2ResourceLogicalId);
      }
    }
    return gen1ToGen2ResourceLogicalIdMapping;
  }

  public removeGen2Resources(gen2Template: CFNTemplate, resourcesToRemove: string[]) {
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    const stackOutputs = this.gen2DescribeStacksResponse?.Outputs;
    assert(stackOutputs);
    // const resolvedOutputsGen2Template = this.resolveStackOutputs(clonedGen2Template, stackOutputs);
    const resolvedRefsGen2Template = this.resolveRefs(resourcesToRemove, clonedGen2Template, stackOutputs);
    resourcesToRemove.forEach((logicalResourceId) => {
      delete resolvedRefsGen2Template.Resources[logicalResourceId];
    });
    return resolvedRefsGen2Template;
  }

  async generateRefactorTemplates(
    gen1ResourcesToMove: Map<string, CFNResource>,
    gen2ResourcesToRemove: Map<string, CFNResource>,
    gen1Template: CFNTemplate,
    gen2Template: CFNTemplate,
  ): Promise<CFNStackRefactorTemplates> {
    const gen1LogicalResourceIds = [...gen1ResourcesToMove.keys()];
    const resolvedGen1ParametersTemplate = this.resolveGen1ParametersForRefactor(gen1Template);
    const gen1StackOutputs = this.gen1DescribeStacksResponse?.Outputs;
    assert(gen1StackOutputs);
    // const resolvedGen1RefOutputsTemplate = this.resolveRefs(gen1LogicalResourceIds, resolvedGen1ParametersTemplate, gen1StackOutputs);
    const gen1ToGen2ResourceLogicalIdMapping = this.buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourcesToMove, gen2ResourcesToRemove);
    const gen2TemplateForRefactor = this.addGen1ResourcesToGen2Stack(
      resolvedGen1ParametersTemplate,
      gen1LogicalResourceIds,
      gen1ToGen2ResourceLogicalIdMapping,
      gen2Template,
    );
    const gen1TemplateForRefactor = this.removeGen1ResourcesFromGen1Stack(resolvedGen1ParametersTemplate, gen1LogicalResourceIds);
    return {
      sourceTemplate: gen1TemplateForRefactor,
      destinationTemplate: gen2TemplateForRefactor,
      logicalIdMapping: gen1ToGen2ResourceLogicalIdMapping,
    };
  }
}
