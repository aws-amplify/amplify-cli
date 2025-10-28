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
} from '../types';
import CFNConditionResolver from '../resolvers/cfn-condition-resolver';
import CfnParameterResolver from '../resolvers/cfn-parameter-resolver';
import CfnOutputResolver from '../resolvers/cfn-output-resolver';
import CfnDependencyResolver from '../resolvers/cfn-dependency-resolver';
import extractStackNameFromId from '../utils';
import retrieveOAuthValues from '../oauth-values-retriever';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export const HOSTED_PROVIDER_META_PARAMETER_NAME = 'hostedUIProviderMeta';
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
    console.log('[DEBUG] generateGen1PreProcessTemplate: Starting Gen1 pre-process template generation');
    console.log('[DEBUG] Gen1 Stack ID:', this.gen1StackId);

    this.gen1DescribeStacksResponse = await this.describeStack(this.gen1StackId);
    assert(this.gen1DescribeStacksResponse);
    const { Parameters, Outputs } = this.gen1DescribeStacksResponse;
    assert(Parameters);
    assert(Outputs);
    console.log('[DEBUG] Gen1 Stack Parameters count:', Parameters.length);
    console.log('[DEBUG] Gen1 Stack Parameters:', JSON.stringify(Parameters, null, 2));
    console.log('[DEBUG] Gen1 Stack Outputs count:', Outputs.length);
    console.log('[DEBUG] Gen1 Stack Outputs:', JSON.stringify(Outputs, null, 2));

    const oldGen1Template = await this.readTemplate(this.gen1StackId);
    console.log('[DEBUG] Gen1 Template Resources count:', Object.keys(oldGen1Template.Resources).length);
    this.gen1ResourcesToMove = new Map(
      Object.entries(oldGen1Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    console.log('[DEBUG] Gen1 Resources to move:', Array.from(this.gen1ResourcesToMove.keys()));
    console.log('[DEBUG] Gen1 Resources to move count:', this.gen1ResourcesToMove.size);
    console.log('[DEBUG] Gen1 Resources to move details:');
    for (const [logicalId, resource] of this.gen1ResourcesToMove) {
      console.log(`[DEBUG]   - ${logicalId}: Type=${resource.Type}`);
      if (resource.DependsOn) {
        console.log(`[DEBUG]     DependsOn: ${JSON.stringify(resource.DependsOn)}`);
      }
    }

    // validate empty resources
    if (this.gen1ResourcesToMove.size === 0) throw new Error('No resources to move in Gen1 stack.');
    const logicalResourceIds = [...this.gen1ResourcesToMove.keys()];

    console.log('[DEBUG] Resolving Gen1 parameters...');
    const gen1ParametersResolvedTemplate = new CfnParameterResolver(oldGen1Template, extractStackNameFromId(this.gen1StackId)).resolve(
      Parameters,
    );

    console.log('[DEBUG] Describing Gen1 stack resources...');
    const stackResources = await this.describeStackResources(this.gen1StackId);
    console.log('[DEBUG] Gen1 Stack Resources count:', stackResources.length);

    console.log('[DEBUG] Resolving Gen1 outputs...');
    const gen1TemplateWithOutputsResolved = new CfnOutputResolver(gen1ParametersResolvedTemplate, this.region, this.accountId).resolve(
      logicalResourceIds,
      Outputs,
      stackResources,
    );

    console.log('[DEBUG] Resolving Gen1 dependencies...');
    const gen1TemplateWithDepsResolved = new CfnDependencyResolver(gen1TemplateWithOutputsResolved).resolve(logicalResourceIds);

    console.log('[DEBUG] Resolving Gen1 conditions...');
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
    console.log('[DEBUG] generateGen2ResourceRemovalTemplate: Starting Gen2 resource removal template generation');
    console.log('[DEBUG] Gen2 Stack ID:', this.gen2StackId);

    this.gen2DescribeStacksResponse = await this.describeStack(this.gen2StackId);
    assert(this.gen2DescribeStacksResponse);
    const { Parameters, Outputs } = this.gen2DescribeStacksResponse;
    assert(Outputs);
    this.gen2StackParameters = Parameters;
    console.log('[DEBUG] Gen2 Stack Parameters count:', Parameters?.length ?? 0);
    if (Parameters) {
      console.log('[DEBUG] Gen2 Stack Parameters:', JSON.stringify(Parameters, null, 2));
    }
    console.log('[DEBUG] Gen2 Stack Outputs count:', Outputs.length);
    console.log('[DEBUG] Gen2 Stack Outputs:', JSON.stringify(Outputs, null, 2));

    const oldGen2Template = await this.readTemplate(this.gen2StackId);
    console.log('[DEBUG] Gen2 Template Resources count:', Object.keys(oldGen2Template.Resources).length);
    this.gen2Template = oldGen2Template;

    this.gen2ResourcesToRemove = new Map(
      Object.entries(oldGen2Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    console.log('[DEBUG] Gen2 Resources to remove:', Array.from(this.gen2ResourcesToRemove.keys()));
    console.log('[DEBUG] Gen2 Resources to remove count:', this.gen2ResourcesToRemove.size);
    console.log('[DEBUG] Gen2 Resources to remove details:');
    for (const [logicalId, resource] of this.gen2ResourcesToRemove) {
      console.log(`[DEBUG]   - ${logicalId}: Type=${resource.Type}`);
      if (resource.DependsOn) {
        console.log(`[DEBUG]     DependsOn: ${JSON.stringify(resource.DependsOn)}`);
      }
    }

    // validate empty resources
    if (this.gen2ResourcesToRemove.size === 0) throw new Error('No resources to remove in Gen2 stack.');
    const logicalResourceIds = [...this.gen2ResourcesToRemove.keys()];

    console.log('[DEBUG] Removing Gen2 resources from Gen2 stack...');
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
    console.log('[DEBUG] removeGen1ResourcesFromGen1Stack: Removing resources from Gen1 stack');
    console.log('[DEBUG] Resources to remove:', resourcesToRefactor);
    const resources = gen1Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      console.log('[DEBUG] Removing resource:', resourceToRefactor);
      delete resources[resourceToRefactor];
    }
    console.log('[DEBUG] Gen1 template resources remaining:', Object.keys(resources).length);
    return gen1Template;
  }

  private addGen1ResourcesToGen2Stack(
    resolvedGen1Template: CFNTemplate,
    resourcesToRefactor: string[],
    gen1ToGen2ResourceLogicalIdMapping: Map<string, string>,
    gen2Template: CFNTemplate,
  ) {
    console.log('[DEBUG] addGen1ResourcesToGen2Stack: Adding Gen1 resources to Gen2 stack');
    console.log('[DEBUG] Resources to add:', resourcesToRefactor);
    console.log('[DEBUG] Resource mapping:', Array.from(gen1ToGen2ResourceLogicalIdMapping.entries()));
    const resources = gen2Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      const gen2ResourceLogicalId = gen1ToGen2ResourceLogicalIdMapping.get(resourceToRefactor);
      assert(gen2ResourceLogicalId);
      console.log(`[DEBUG] Adding resource: ${resourceToRefactor} -> ${gen2ResourceLogicalId}`);
      resources[gen2ResourceLogicalId] = resolvedGen1Template.Resources[resourceToRefactor];
      // replace Gen1 dependency with Gen2 counterparts for Gen1 resources being moved over to Gen2
      const dependencies = resources[gen2ResourceLogicalId].DependsOn;
      if (!dependencies) {
        console.log(`[DEBUG] No dependencies for resource: ${gen2ResourceLogicalId}`);
        continue;
      }
      console.log(`[DEBUG] Original dependencies for ${gen2ResourceLogicalId}:`, dependencies);
      const dependenciesArray = Array.isArray(dependencies) ? dependencies : [dependencies];
      resources[gen2ResourceLogicalId].DependsOn = dependenciesArray.map((dependency) => {
        if (gen1ToGen2ResourceLogicalIdMapping.has(dependency)) {
          const gen2DependencyName = gen1ToGen2ResourceLogicalIdMapping.get(dependency);
          assert(gen2DependencyName);
          console.log(`[DEBUG] Mapping dependency: ${dependency} -> ${gen2DependencyName}`);
          return gen2DependencyName;
        } else {
          console.log(`[DEBUG] Keeping dependency unchanged: ${dependency}`);
          return dependency;
        }
      });
      console.log(`[DEBUG] Updated dependencies for ${gen2ResourceLogicalId}:`, resources[gen2ResourceLogicalId].DependsOn);
    }
    console.log('[DEBUG] Gen2 template resources after adding Gen1 resources:', Object.keys(resources).length);
    return gen2Template;
  }

  private buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourceMap: Map<string, CFNResource>, gen2ResourceMap: Map<string, CFNResource>) {
    console.log('[DEBUG] buildGen1ToGen2ResourceLogicalIdMapping: Building resource mapping');
    console.log('[DEBUG] Gen1 resources:', Array.from(gen1ResourceMap.keys()));
    console.log('[DEBUG] Gen2 resources:', Array.from(gen2ResourceMap.keys()));
    const clonedGen1ResourceMap = new Map(gen1ResourceMap);
    const clonedGen2ResourceMap = new Map(gen2ResourceMap);
    const gen1ToGen2ResourceLogicalIdMapping = new Map<string, string>();
    for (const [gen1ResourceLogicalId, gen1Resource] of clonedGen1ResourceMap) {
      console.log(`[DEBUG] Processing Gen1 resource: ${gen1ResourceLogicalId} (Type: ${gen1Resource.Type})`);
      for (const [gen2ResourceLogicalId, gen2Resource] of clonedGen2ResourceMap) {
        if (gen2Resource.Type !== gen1Resource.Type) {
          continue;
        }
        console.log(`[DEBUG] Checking Gen2 resource: ${gen2ResourceLogicalId} (Type: ${gen2Resource.Type})`);
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
          console.log(`[DEBUG] Mapping found: ${gen1ResourceLogicalId} -> ${gen2ResourceLogicalId}`);
          gen1ToGen2ResourceLogicalIdMapping.set(gen1ResourceLogicalId, gen2ResourceLogicalId);
          clonedGen1ResourceMap.delete(gen1ResourceLogicalId);
          clonedGen2ResourceMap.delete(gen2ResourceLogicalId);
          break;
        }
      }
    }
    console.log('[DEBUG] Final resource mapping:', Array.from(gen1ToGen2ResourceLogicalIdMapping.entries()));
    console.log('[DEBUG] Un-mapped Gen1 resources:', Array.from(clonedGen1ResourceMap.keys()));
    console.log('[DEBUG] Un-mapped Gen2 resources:', Array.from(clonedGen2ResourceMap.keys()));
    return gen1ToGen2ResourceLogicalIdMapping;
  }

  private async removeGen2ResourcesFromGen2Stack(gen2Template: CFNTemplate, resourcesToRemove: string[]) {
    console.log('[DEBUG] removeGen2ResourcesFromGen2Stack: Removing Gen2 resources from Gen2 stack');
    console.log('[DEBUG] Resources to remove:', resourcesToRemove);
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    const stackOutputs = this.gen2DescribeStacksResponse?.Outputs;
    assert(stackOutputs);
    console.log('[DEBUG] Stack outputs count:', stackOutputs.length);

    console.log('[DEBUG] Describing Gen2 stack resources...');
    const stackResources = await this.describeStackResources(this.gen2StackId);
    console.log('[DEBUG] Gen2 Stack Resources count:', stackResources.length);

    console.log('[DEBUG] Resolving Gen2 dependencies...');
    const gen2TemplateWithDepsResolved = new CfnDependencyResolver(clonedGen2Template).resolve(resourcesToRemove);

    console.log('[DEBUG] Resolving Gen2 output references...');
    const resolvedRefsGen2Template = new CfnOutputResolver(gen2TemplateWithDepsResolved, this.region, this.accountId).resolve(
      resourcesToRemove,
      stackOutputs,
      stackResources,
    );

    console.log('[DEBUG] Deleting resources from template...');
    resourcesToRemove.forEach((logicalResourceId) => {
      console.log('[DEBUG] Deleting resource:', logicalResourceId);
      delete resolvedRefsGen2Template.Resources[logicalResourceId];
    });
    console.log('[DEBUG] Gen2 template resources after removal:', Object.keys(resolvedRefsGen2Template.Resources).length);
    return resolvedRefsGen2Template;
  }

  public generateRefactorTemplates(
    gen1ResourcesToMove: Map<string, CFNResource>,
    gen2ResourcesToRemove: Map<string, CFNResource>,
    gen1Template: CFNTemplate,
    gen2Template: CFNTemplate,
    sourceToDestinationResourceLogicalIdMapping?: Map<string, string>,
  ): CFNStackRefactorTemplates {
    console.log('[DEBUG] generateRefactorTemplates: Starting refactor template generation');
    console.log('[DEBUG] Gen1 resources to move:', Array.from(gen1ResourcesToMove.keys()));
    console.log('[DEBUG] Gen2 resources to remove:', Array.from(gen2ResourcesToRemove.keys()));

    const gen1LogicalResourceIds = [...gen1ResourcesToMove.keys()];
    console.log('[DEBUG] Gen1 logical resource IDs:', gen1LogicalResourceIds);

    if (sourceToDestinationResourceLogicalIdMapping) {
      console.log('[DEBUG] Using provided resource mapping:', Array.from(sourceToDestinationResourceLogicalIdMapping.entries()));
    } else {
      console.log('[DEBUG] Building resource mapping...');
    }

    const gen1ToGen2ResourceLogicalIdMapping =
      sourceToDestinationResourceLogicalIdMapping ??
      this.buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourcesToMove, gen2ResourcesToRemove);

    console.log('[DEBUG] Cloning templates...');
    const clonedGen1Template = JSON.parse(JSON.stringify(gen1Template));
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    console.log('[DEBUG] Cloned Gen1 template resources:', Object.keys(clonedGen1Template.Resources).length);
    console.log('[DEBUG] Cloned Gen2 template resources:', Object.keys(clonedGen2Template.Resources).length);

    console.log('[DEBUG] Adding Gen1 resources to Gen2 stack...');
    const gen2TemplateForRefactor = this.addGen1ResourcesToGen2Stack(
      clonedGen1Template,
      gen1LogicalResourceIds,
      gen1ToGen2ResourceLogicalIdMapping,
      clonedGen2Template,
    );

    console.log('[DEBUG] Removing Gen1 resources from Gen1 stack...');
    const gen1TemplateForRefactor = this.removeGen1ResourcesFromGen1Stack(clonedGen1Template, gen1LogicalResourceIds);

    console.log('[DEBUG] Refactor templates generated successfully');
    console.log('[DEBUG] Source template resources:', Object.keys(gen1TemplateForRefactor.Resources).length);
    console.log('[DEBUG] Destination template resources:', Object.keys(gen2TemplateForRefactor.Resources).length);

    return {
      sourceTemplate: gen1TemplateForRefactor,
      destinationTemplate: gen2TemplateForRefactor,
      logicalIdMapping: gen1ToGen2ResourceLogicalIdMapping,
    };
  }
}

export default CategoryTemplateGenerator;
