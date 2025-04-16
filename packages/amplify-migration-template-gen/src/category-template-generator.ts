import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  GetTemplateCommand,
  Stack,
  Parameter,
} from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import assert from 'node:assert';
import {
  CFN_AUTH_TYPE,
  CFN_CATEGORY_TYPE,
  CFN_IAM_TYPE,
  CFNChangeTemplateWithParams,
  CFNResource,
  CFNStackRefactorTemplates,
  CFNTemplate,
} from './types';
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
const GEN1_WEB_APP_CLIENT = 'UserPoolClientWeb';
const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
const RESOURCE_TYPES_WITH_MULTIPLE_RESOURCES = [
  CFN_AUTH_TYPE.UserPoolClient.valueOf(),
  CFN_AUTH_TYPE.UserPoolGroup.valueOf(),
  CFN_IAM_TYPE.Role.valueOf(),
];

class CategoryTemplateGenerator<CFNCategoryType extends CFN_CATEGORY_TYPE> {
  private gen1DescribeStacksResponse: Stack | undefined;
  private gen2DescribeStacksResponse: Stack | undefined;
  public gen1ResourcesToMove: Map<string, CFNResource>;
  public gen2ResourcesToRemove: Map<string, CFNResource>;
  public gen2Template: CFNTemplate | undefined;
  public gen2StackParameters: Parameter[] | undefined;
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

    const stackResources = await this.describeStackResources(this.gen1StackId);
    const gen1TemplateWithOutputsResolved = new CfnOutputResolver(gen1ParametersResolvedTemplate, this.region, this.accountId).resolve(
      logicalResourceIds,
      Outputs,
      stackResources,
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
    this.gen2StackParameters = Parameters;
    const oldGen2Template = await this.readTemplate(this.gen2StackId);
    this.gen2Template = oldGen2Template;
    this.gen2ResourcesToRemove = new Map(
      Object.entries(oldGen2Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    // validate empty resources
    if (this.gen2ResourcesToRemove.size === 0) throw new Error('No resources to remove in Gen2 stack.');
    const logicalResourceIds = [...this.gen2ResourcesToRemove.keys()];
    const updatedGen2Template = await this.removeGen2ResourcesFromGen2Stack(oldGen2Template, logicalResourceIds);
    return {
      oldTemplate: oldGen2Template,
      newTemplate: updatedGen2Template,
      parameters: Parameters,
    };
  }

  public generateStackRefactorTemplates(gen1Template: CFNTemplate, gen2Template: CFNTemplate): CFNStackRefactorTemplates {
    return this.generateRefactorTemplates(this.gen1ResourcesToMove, this.gen2ResourcesToRemove, gen1Template, gen2Template);
  }

  public async readTemplate(stackId: string) {
    const getTemplateResponse = await this.cfnClient.send(
      new GetTemplateCommand({
        StackName: stackId,
      }),
    );
    const templateBody = getTemplateResponse.TemplateBody;
    assert(templateBody);
    return JSON.parse(templateBody) as CFNTemplate;
  }

  public async describeStack(stackId: string) {
    return (
      await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackId,
        }),
      )
    ).Stacks?.[0];
  }

  private async describeStackResources(stackId: string) {
    const { StackResources } = await this.cfnClient.send(
      new DescribeStackResourcesCommand({
        StackName: stackId,
      }),
    );

    assert(StackResources && StackResources.length > 0);

    return StackResources;
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
        // Since we have 2 app clients, we want to map the corresponding app clients (Web->Web, Native->Native)
        // In gen1, we differentiate clients with Web. In gen2, we differentiate with Native.
        const isWebClient = gen1ResourceLogicalId === GEN1_WEB_APP_CLIENT && !gen2ResourceLogicalId.includes(GEN2_NATIVE_APP_CLIENT);
        const isNativeClient = gen1ResourceLogicalId !== GEN1_WEB_APP_CLIENT && gen2ResourceLogicalId.includes(GEN2_NATIVE_APP_CLIENT);
        const foundUserPoolClientPair = gen1Resource.Type === CFN_AUTH_TYPE.UserPoolClient && (isWebClient || isNativeClient);
        const foundUserPoolGroupPair =
          gen1Resource.Type === CFN_AUTH_TYPE.UserPoolGroup && gen2ResourceLogicalId.includes(gen1ResourceLogicalId);
        const foundIamRolePair = gen1Resource.Type === CFN_IAM_TYPE.Role && gen2ResourceLogicalId.includes(gen1ResourceLogicalId);
        if (
          !RESOURCE_TYPES_WITH_MULTIPLE_RESOURCES.includes(gen1Resource.Type) ||
          foundUserPoolClientPair ||
          foundUserPoolGroupPair ||
          foundIamRolePair
        ) {
          gen1ToGen2ResourceLogicalIdMapping.set(gen1ResourceLogicalId, gen2ResourceLogicalId);
          clonedGen1ResourceMap.delete(gen1ResourceLogicalId);
          clonedGen2ResourceMap.delete(gen2ResourceLogicalId);
          break;
        }
      }
    }
    return gen1ToGen2ResourceLogicalIdMapping;
  }

  private async removeGen2ResourcesFromGen2Stack(gen2Template: CFNTemplate, resourcesToRemove: string[]) {
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    const stackOutputs = this.gen2DescribeStacksResponse?.Outputs;
    assert(stackOutputs);
    const stackResources = await this.describeStackResources(this.gen2StackId);
    const gen2TemplateWithDepsResolved = new CfnDependencyResolver(clonedGen2Template).resolve(resourcesToRemove);
    const resolvedRefsGen2Template = new CfnOutputResolver(gen2TemplateWithDepsResolved, this.region, this.accountId).resolve(
      resourcesToRemove,
      stackOutputs,
      stackResources,
    );
    resourcesToRemove.forEach((logicalResourceId) => {
      delete resolvedRefsGen2Template.Resources[logicalResourceId];
    });
    return resolvedRefsGen2Template;
  }

  public generateRefactorTemplates(
    gen1ResourcesToMove: Map<string, CFNResource>,
    gen2ResourcesToRemove: Map<string, CFNResource>,
    gen1Template: CFNTemplate,
    gen2Template: CFNTemplate,
    sourceToDestinationResourceLogicalIdMapping?: Map<string, string>,
  ): CFNStackRefactorTemplates {
    const gen1LogicalResourceIds = [...gen1ResourcesToMove.keys()];
    const gen1ToGen2ResourceLogicalIdMapping =
      sourceToDestinationResourceLogicalIdMapping ??
      this.buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourcesToMove, gen2ResourcesToRemove);
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
