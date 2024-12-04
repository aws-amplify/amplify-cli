import { CloudFormationClient, DescribeStacksCommand, GetTemplateCommand, Stack } from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import assert from 'node:assert';
import { CFN_CATEGORY_TYPE, CFNChangeTemplateWithParams, CFNResource, CFNStackRefactorTemplates, CFNTemplate } from './types';
import CFNConditionResolver from './resolvers/cfn-condition-resolver';
import CfnParameterResolver from './resolvers/cfn-parameter-resolver';
import CfnOutputResolver from './resolvers/cfn-output-resolver';
import CfnDependencyResolver from './resolvers/cfn-dependency-resolver';
import extractStackNameFromId from './cfn-stack-name-extractor';
import retrieveOAuthValues from './oauth-values-retriever';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
const HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME = 'hostedUIProviderCreds';
const USER_POOL_ID_OUTPUT_KEY_NAME = 'UserPoolId';

class CategoryTemplateGenerator<CFNCategoryType extends CFN_CATEGORY_TYPE> {
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
    private readonly ssmClient: SSMClient,
    private readonly cognitoIdpClient: CognitoIdentityProviderClient,
    private readonly appId: string,
    private readonly environmentName: string,
    private readonly resourcesToMove: CFNCategoryType[],
    private readonly resourcesToMovePredicate?: (resourcesToMove: CFN_CATEGORY_TYPE[], resourceEntry: [string, CFNResource]) => boolean,
  ) {
    this.gen1ResourcesToMove = new Map();
    this.gen2ResourcesToRemove = new Map();
  }

  public async generateGen1PreProcessTemplate(): Promise<CFNChangeTemplateWithParams> {
    this.gen1DescribeStacksResponse = await this.describeStack(this.gen1StackId);
    assert(this.gen1DescribeStacksResponse);
    const { Parameters, Outputs } = this.gen1DescribeStacksResponse;
    assert(Parameters);
    assert(Outputs);
    const oldGen1Template = await this.readTemplate(this.gen1StackId);
    this.gen1ResourcesToMove = new Map(
      Object.entries(oldGen1Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    // validate empty resources
    if (this.gen1ResourcesToMove.size === 0) throw new Error('No resources to move in Gen1 stack.');
    const logicalResourceIds = [...this.gen1ResourcesToMove.keys()];
    const gen1ParametersResolvedTemplate = new CfnParameterResolver(oldGen1Template, extractStackNameFromId(this.gen1StackId)).resolve(
      Parameters,
    );
    const gen1TemplateWithOutputsResolved = new CfnOutputResolver(gen1ParametersResolvedTemplate, this.region, this.accountId).resolve(
      logicalResourceIds,
      Outputs,
    );
    const gen1TemplateWithDepsResolved = new CfnDependencyResolver(gen1TemplateWithOutputsResolved).resolve(logicalResourceIds);
    const gen1TemplateWithConditionsResolved = new CFNConditionResolver(gen1TemplateWithDepsResolved).resolve(Parameters);
    const oAuthProvidersParam = Parameters.find((param) => param.ParameterKey === HOSTED_PROVIDER_META_PARAMETER_NAME);
    if (oAuthProvidersParam) {
      const userPoolId = Outputs.find((op) => op.OutputKey === USER_POOL_ID_OUTPUT_KEY_NAME)?.OutputValue;
      assert(userPoolId);
      const oAuthValues = await retrieveOAuthValues({
        ssmClient: this.ssmClient,
        cognitoIdpClient: this.cognitoIdpClient,
        appId: this.appId,
        environmentName: this.environmentName,
        oAuthParameter: oAuthProvidersParam,
        userPoolId,
      });
      const oAuthProviderCredentialsParam = Parameters.find((param) => param.ParameterKey === HOSTED_PROVIDER_CREDENTIALS_PARAMETER_NAME);
      assert(oAuthProviderCredentialsParam);
      oAuthProviderCredentialsParam.ParameterValue = JSON.stringify(oAuthValues);
      return {
        oldTemplate: oldGen1Template,
        newTemplate: gen1TemplateWithConditionsResolved,
        parameters: Parameters,
      };
    }
    return {
      oldTemplate: oldGen1Template,
      newTemplate: gen1TemplateWithConditionsResolved,
      parameters: Parameters,
    };
  }

  public async generateGen2ResourceRemovalTemplate(): Promise<CFNChangeTemplateWithParams> {
    this.gen2DescribeStacksResponse = await this.describeStack(this.gen2StackId);
    assert(this.gen2DescribeStacksResponse);
    const { Parameters, Outputs } = this.gen2DescribeStacksResponse;
    assert(Outputs);
    const oldGen2Template = await this.readTemplate(this.gen2StackId);
    this.gen2ResourcesToRemove = new Map(
      Object.entries(oldGen2Template.Resources).filter(([, value]) =>
        this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type),
      ),
    );
    // validate empty resources
    if (this.gen2ResourcesToRemove.size === 0) throw new Error('No resources to remove in Gen2 stack.');
    const updatedGen2Template = this.removeGen2ResourcesFromGen2Stack(oldGen2Template, [...this.gen2ResourcesToRemove.keys()]);
    return {
      oldTemplate: oldGen2Template,
      newTemplate: updatedGen2Template,
      parameters: Parameters,
    };
  }

  public generateStackRefactorTemplates(gen1Template: CFNTemplate, gen2Template: CFNTemplate): CFNStackRefactorTemplates {
    return this.generateRefactorTemplates(this.gen1ResourcesToMove, this.gen2ResourcesToRemove, gen1Template, gen2Template);
  }

  private async readTemplate(stackId: string) {
    const getTemplateResponse = await this.cfnClient.send(
      new GetTemplateCommand({
        StackName: stackId,
      }),
    );
    const templateBody = getTemplateResponse.TemplateBody;
    assert(templateBody);
    return JSON.parse(templateBody) as CFNTemplate;
  }

  private async describeStack(stackId: string) {
    return (
      await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackId,
        }),
      )
    ).Stacks?.[0];
  }

  private removeGen1ResourcesFromGen1Stack(gen1Template: CFNTemplate, resourcesToRefactor: string[]) {
    const resources = gen1Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      delete resources[resourceToRefactor];
    }
    return gen1Template;
  }

  private addGen1ResourcesToGen2Stack(
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
      // replace Gen1 dependency with Gen2 counterparts for Gen1 resources being moved over to Gen2
      const dependencies = resources[gen2ResourceLogicalId].DependsOn;
      if (!dependencies) continue;
      resources[gen2ResourceLogicalId].DependsOn =
        dependencies?.map((dependency) => {
          if (gen1ToGen2ResourceLogicalIdMapping.has(dependency)) {
            const gen2DependencyName = gen1ToGen2ResourceLogicalIdMapping.get(dependency);
            assert(gen2DependencyName);
            return gen2DependencyName;
          } else return dependency;
        }) ?? [];
    }
    return gen2Template;
  }

  private buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourceMap: Map<string, CFNResource>, gen2ResourceMap: Map<string, CFNResource>) {
    const clonedGen1ResourceMap = new Map(gen1ResourceMap);
    const clonedGen2ResourceMap = new Map(gen2ResourceMap);
    const gen1ToGen2ResourceLogicalIdMapping = new Map<string, string>();
    for (const [gen1ResourceLogicalId, gen1Resource] of clonedGen1ResourceMap) {
      for (const [gen2ResourceLogicalId, gen2Resource] of clonedGen2ResourceMap) {
        if (gen2Resource.Type !== gen1Resource.Type) {
          continue;
        }
        gen1ToGen2ResourceLogicalIdMapping.set(gen1ResourceLogicalId, gen2ResourceLogicalId);
        clonedGen1ResourceMap.delete(gen1ResourceLogicalId);
        clonedGen2ResourceMap.delete(gen2ResourceLogicalId);
        break;
      }
    }
    return gen1ToGen2ResourceLogicalIdMapping;
  }

  private removeGen2ResourcesFromGen2Stack(gen2Template: CFNTemplate, resourcesToRemove: string[]) {
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    const stackOutputs = this.gen2DescribeStacksResponse?.Outputs;
    assert(stackOutputs);
    const resolvedRefsGen2Template = new CfnOutputResolver(clonedGen2Template, this.region, this.accountId).resolve(
      resourcesToRemove,
      stackOutputs,
    );
    resourcesToRemove.forEach((logicalResourceId) => {
      delete resolvedRefsGen2Template.Resources[logicalResourceId];
    });
    return resolvedRefsGen2Template;
  }

  private generateRefactorTemplates(
    gen1ResourcesToMove: Map<string, CFNResource>,
    gen2ResourcesToRemove: Map<string, CFNResource>,
    gen1Template: CFNTemplate,
    gen2Template: CFNTemplate,
  ): CFNStackRefactorTemplates {
    const gen1LogicalResourceIds = [...gen1ResourcesToMove.keys()];
    const gen1StackOutputs = this.gen1DescribeStacksResponse?.Outputs;
    assert(gen1StackOutputs);
    const gen1ToGen2ResourceLogicalIdMapping = this.buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourcesToMove, gen2ResourcesToRemove);
    const clonedGen1Template = JSON.parse(JSON.stringify(gen1Template));
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    const gen2TemplateForRefactor = this.addGen1ResourcesToGen2Stack(
      clonedGen1Template,
      gen1LogicalResourceIds,
      gen1ToGen2ResourceLogicalIdMapping,
      clonedGen2Template,
    );
    const gen1TemplateForRefactor = this.removeGen1ResourcesFromGen1Stack(clonedGen1Template, gen1LogicalResourceIds);
    return {
      sourceTemplate: gen1TemplateForRefactor,
      destinationTemplate: gen2TemplateForRefactor,
      logicalIdMapping: gen1ToGen2ResourceLogicalIdMapping,
    };
  }
}

export default CategoryTemplateGenerator;
