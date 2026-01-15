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
import { Logger } from '../../../gen2-migration';

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
    private readonly logger: Logger,
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
    this.logger.debug('generateGen1PreProcessTemplate: Starting Gen1 pre-process template generation');
    this.logger.debug(`Gen1 Stack ID: ${this.gen1StackId}`);

    this.gen1DescribeStacksResponse = await this.describeStack(this.gen1StackId);
    assert(this.gen1DescribeStacksResponse);
    const { Parameters, Outputs } = this.gen1DescribeStacksResponse;
    assert(Parameters);
    assert(Outputs);
    this.logger.debug(`Gen1 Stack Parameters count: ${Parameters.length}`);
    this.logger.debug(`Gen1 Stack Parameters: ${JSON.stringify(Parameters, null, 2)}`);
    this.logger.debug(`Gen1 Stack Outputs count: ${Outputs.length}`);
    this.logger.debug(`Gen1 Stack Outputs: ${JSON.stringify(Outputs, null, 2)}`);

    const oldGen1Template = await this.readTemplate(this.gen1StackId);
    this.logger.debug(`Gen1 Template Resources count: ${Object.keys(oldGen1Template.Resources).length}`);
    this.gen1ResourcesToMove = new Map(
      Object.entries(oldGen1Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    this.logger.debug(`Gen1 Resources to move: ${Array.from(this.gen1ResourcesToMove.keys())}`);
    this.logger.debug(`Gen1 Resources to move count: ${this.gen1ResourcesToMove.size}`);
    this.logger.debug('Gen1 Resources to move details:');
    for (const [logicalId, resource] of this.gen1ResourcesToMove) {
      this.logger.debug(`   - ${logicalId}: Type=${resource.Type}`);
      if (resource.DependsOn) {
        this.logger.debug(`     DependsOn: ${JSON.stringify(resource.DependsOn)}`);
      }
    }

    // validate empty resources
    if (this.gen1ResourcesToMove.size === 0) throw new Error('No resources to move in Gen1 stack.');
    const logicalResourceIds = [...this.gen1ResourcesToMove.keys()];

    this.logger.debug('Resolving Gen1 parameters...');
    const gen1ParametersResolvedTemplate = new CfnParameterResolver(oldGen1Template, extractStackNameFromId(this.gen1StackId)).resolve(
      Parameters,
    );

    this.logger.debug('Describing Gen1 stack resources...');
    const stackResources = await this.describeStackResources(this.gen1StackId);
    this.logger.debug(`Gen1 Stack Resources count: ${stackResources.length}`);

    this.logger.debug('Resolving Gen1 outputs...');
    const gen1TemplateWithOutputsResolved = new CfnOutputResolver(gen1ParametersResolvedTemplate, this.region, this.accountId).resolve(
      logicalResourceIds,
      Outputs,
      stackResources,
    );

    this.logger.debug('Resolving Gen1 dependencies...');
    const gen1TemplateWithDepsResolved = new CfnDependencyResolver(gen1TemplateWithOutputsResolved).resolve(logicalResourceIds);

    this.logger.debug('Resolving Gen1 conditions...');
    const gen1TemplateWithConditionsResolved = new CFNConditionResolver(gen1TemplateWithDepsResolved).resolve(Parameters);

    // CloudFormation requires at least one resource in a stack.
    // If all resources are being moved, add a placeholder resource now so it exists
    // in the stack before the refactor operation.
    const totalResources = Object.keys(oldGen1Template.Resources).length;
    const resourcesToMoveCount = this.gen1ResourcesToMove.size;
    if (totalResources === resourcesToMoveCount) {
      this.logger.debug('All Gen1 resources will be moved, adding placeholder resource to Gen1 stack');
      gen1TemplateWithConditionsResolved.Resources['MigrationPlaceholder'] = {
        Type: 'AWS::CloudFormation::WaitConditionHandle',
        Properties: {},
      };
    }

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
    this.logger.debug('generateGen2ResourceRemovalTemplate: Starting Gen2 resource removal template generation');
    this.logger.debug(`Gen2 Stack ID: ${this.gen2StackId}`);

    this.gen2DescribeStacksResponse = await this.describeStack(this.gen2StackId);
    assert(this.gen2DescribeStacksResponse);
    const { Parameters, Outputs } = this.gen2DescribeStacksResponse;
    assert(Outputs);
    this.gen2StackParameters = Parameters;
    this.logger.debug(`Gen2 Stack Parameters count: ${Parameters?.length ?? 0}`);
    if (Parameters) {
      this.logger.debug(`Gen2 Stack Parameters: ${JSON.stringify(Parameters, null, 2)}`);
    }
    this.logger.debug(`Gen2 Stack Outputs count: ${Outputs.length}`);
    this.logger.debug(`Gen2 Stack Outputs: ${JSON.stringify(Outputs, null, 2)}`);

    const oldGen2Template = await this.readTemplate(this.gen2StackId);
    this.logger.debug(`Gen2 Template Resources count: ${Object.keys(oldGen2Template.Resources).length}`);
    this.gen2Template = oldGen2Template;

    this.gen2ResourcesToRemove = new Map(
      Object.entries(oldGen2Template.Resources).filter(([logicalId, value]) => {
        return (
          this.resourcesToMovePredicate?.(this.resourcesToMove, [logicalId, value]) ??
          this.resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type)
        );
      }),
    );
    this.logger.debug(`Gen2 Resources to remove: ${Array.from(this.gen2ResourcesToRemove.keys())}`);
    this.logger.debug(`Gen2 Resources to remove count: ${this.gen2ResourcesToRemove.size}`);
    this.logger.debug('Gen2 Resources to remove details:');
    for (const [logicalId, resource] of this.gen2ResourcesToRemove) {
      this.logger.debug(`   - ${logicalId}: Type=${resource.Type}`);
      if (resource.DependsOn) {
        this.logger.debug(`     DependsOn: ${JSON.stringify(resource.DependsOn)}`);
      }
    }

    // validate empty resources
    if (this.gen2ResourcesToRemove.size === 0) throw new Error('No resources to remove in Gen2 stack.');
    const logicalResourceIds = [...this.gen2ResourcesToRemove.keys()];

    this.logger.debug('Removing Gen2 resources from Gen2 stack...');
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
    this.logger.debug('removeGen1ResourcesFromGen1Stack: Removing resources from Gen1 stack');
    this.logger.debug(`Resources to remove: ${resourcesToRefactor}`);
    const resources = gen1Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      this.logger.debug(`Removing resource: ${resourceToRefactor}`);
      delete resources[resourceToRefactor];
    }
    this.logger.debug(`Gen1 template resources remaining: ${Object.keys(resources).length}`);
    return gen1Template;
  }

  private addGen1ResourcesToGen2Stack(
    resolvedGen1Template: CFNTemplate,
    resourcesToRefactor: string[],
    gen1ToGen2ResourceLogicalIdMapping: Map<string, string>,
    gen2Template: CFNTemplate,
  ) {
    this.logger.debug('addGen1ResourcesToGen2Stack: Adding Gen1 resources to Gen2 stack');
    this.logger.debug(`Resources to add: ${resourcesToRefactor}`);
    this.logger.debug(`Resource mapping: ${Array.from(gen1ToGen2ResourceLogicalIdMapping.entries())}`);
    const resources = gen2Template.Resources;
    assert(resources);
    for (const resourceToRefactor of resourcesToRefactor) {
      const gen2ResourceLogicalId = gen1ToGen2ResourceLogicalIdMapping.get(resourceToRefactor);
      assert(gen2ResourceLogicalId);
      this.logger.debug(` Adding resource: ${resourceToRefactor} -> ${gen2ResourceLogicalId}`);
      resources[gen2ResourceLogicalId] = resolvedGen1Template.Resources[resourceToRefactor];
      // replace Gen1 dependency with Gen2 counterparts for Gen1 resources being moved over to Gen2
      const dependencies = resources[gen2ResourceLogicalId].DependsOn;
      if (!dependencies) {
        this.logger.debug(` No dependencies for resource: ${gen2ResourceLogicalId}`);
        continue;
      }
      this.logger.debug(` Original dependencies for ${gen2ResourceLogicalId}: ${dependencies}`);
      const dependenciesArray = Array.isArray(dependencies) ? dependencies : [dependencies];
      resources[gen2ResourceLogicalId].DependsOn = dependenciesArray.map((dependency) => {
        if (gen1ToGen2ResourceLogicalIdMapping.has(dependency)) {
          const gen2DependencyName = gen1ToGen2ResourceLogicalIdMapping.get(dependency);
          assert(gen2DependencyName);
          this.logger.debug(` Mapping dependency: ${dependency} -> ${gen2DependencyName}`);
          return gen2DependencyName;
        } else {
          this.logger.debug(` Keeping dependency unchanged: ${dependency}`);
          return dependency;
        }
      });
      this.logger.debug(` Updated dependencies for ${gen2ResourceLogicalId}: ${resources[gen2ResourceLogicalId].DependsOn}`);
    }
    this.logger.debug(`Gen2 template resources after adding Gen1 resources: ${Object.keys(resources).length}`);
    return gen2Template;
  }

  private buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourceMap: Map<string, CFNResource>, gen2ResourceMap: Map<string, CFNResource>) {
    this.logger.debug('buildGen1ToGen2ResourceLogicalIdMapping: Building resource mapping');
    this.logger.debug(`Gen1 resources: ${Array.from(gen1ResourceMap.keys())}`);
    this.logger.debug(`Gen2 resources: ${Array.from(gen2ResourceMap.keys())}`);
    const clonedGen1ResourceMap = new Map(gen1ResourceMap);
    const clonedGen2ResourceMap = new Map(gen2ResourceMap);
    const gen1ToGen2ResourceLogicalIdMapping = new Map<string, string>();
    for (const [gen1ResourceLogicalId, gen1Resource] of clonedGen1ResourceMap) {
      this.logger.debug(`[DEBUG] Processing Gen1 resource: ${gen1ResourceLogicalId} (Type: ${gen1Resource.Type})`);
      let foundMapping = false;
      for (const [gen2ResourceLogicalId, gen2Resource] of clonedGen2ResourceMap) {
        if (gen2Resource.Type !== gen1Resource.Type) {
          continue;
        }
        this.logger.debug(`[DEBUG] Checking Gen2 resource: ${gen2ResourceLogicalId} (Type: ${gen2Resource.Type})`);
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
          this.logger.debug(`Mapping found: ${gen1ResourceLogicalId} -> ${gen2ResourceLogicalId}`);
          gen1ToGen2ResourceLogicalIdMapping.set(gen1ResourceLogicalId, gen2ResourceLogicalId);
          clonedGen1ResourceMap.delete(gen1ResourceLogicalId);
          clonedGen2ResourceMap.delete(gen2ResourceLogicalId);
          foundMapping = true;
          break;
        }
      }
      // If no Gen2 resource found (e.g., Gen2 stack was already updated in a previous failed attempt),
      // use the Gen1 logical ID as the destination. This allows the refactor to complete
      // when re-running after a partial failure.
      if (!foundMapping) {
        this.logger.debug(`No Gen2 mapping found for ${gen1ResourceLogicalId}, using Gen1 logical ID as destination`);
        gen1ToGen2ResourceLogicalIdMapping.set(gen1ResourceLogicalId, gen1ResourceLogicalId);
        clonedGen1ResourceMap.delete(gen1ResourceLogicalId);
      }
    }
    this.logger.debug(`Final resource mapping: ${Array.from(gen1ToGen2ResourceLogicalIdMapping.entries())}`);
    this.logger.debug(`Un-mapped Gen1 resources: ${Array.from(clonedGen1ResourceMap.keys())}`);
    this.logger.debug(`Un-mapped Gen2 resources: ${Array.from(clonedGen2ResourceMap.keys())}`);
    return gen1ToGen2ResourceLogicalIdMapping;
  }

  private async removeGen2ResourcesFromGen2Stack(gen2Template: CFNTemplate, resourcesToRemove: string[]) {
    this.logger.debug('removeGen2ResourcesFromGen2Stack: Removing Gen2 resources from Gen2 stack');
    this.logger.debug(`Resources to remove: ${resourcesToRemove}`);
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    const stackOutputs = this.gen2DescribeStacksResponse?.Outputs;
    assert(stackOutputs);
    this.logger.debug(`Stack outputs count: ${stackOutputs.length}`);

    this.logger.debug('Describing Gen2 stack resources...');
    const stackResources = await this.describeStackResources(this.gen2StackId);
    this.logger.debug(`Gen2 Stack Resources count: ${stackResources.length}`);

    this.logger.debug('Resolving Gen2 dependencies...');
    const gen2TemplateWithDepsResolved = new CfnDependencyResolver(clonedGen2Template).resolve(resourcesToRemove);

    this.logger.debug('Resolving Gen2 output references...');
    const resolvedRefsGen2Template = new CfnOutputResolver(gen2TemplateWithDepsResolved, this.region, this.accountId).resolve(
      resourcesToRemove,
      stackOutputs,
      stackResources,
    );

    this.logger.debug('Deleting resources from template...');
    resourcesToRemove.forEach((logicalResourceId) => {
      this.logger.debug(`Deleting resource: ${logicalResourceId}`);
      delete resolvedRefsGen2Template.Resources[logicalResourceId];
    });
    this.logger.debug(`Gen2 template resources after removal: ${Object.keys(resolvedRefsGen2Template.Resources).length}`);
    return resolvedRefsGen2Template;
  }

  public generateRefactorTemplates(
    gen1ResourcesToMove: Map<string, CFNResource>,
    gen2ResourcesToRemove: Map<string, CFNResource>,
    gen1Template: CFNTemplate,
    gen2Template: CFNTemplate,
    sourceToDestinationResourceLogicalIdMapping?: Map<string, string>,
  ): CFNStackRefactorTemplates {
    this.logger.debug('generateRefactorTemplates: Starting refactor template generation');
    this.logger.debug(`Gen1 resources to move: ${Array.from(gen1ResourcesToMove.keys())}`);
    this.logger.debug(`Gen2 resources to remove: ${Array.from(gen2ResourcesToRemove.keys())}`);

    const gen1LogicalResourceIds = [...gen1ResourcesToMove.keys()];
    this.logger.debug(`Gen1 logical resource IDs: ${gen1LogicalResourceIds}`);

    if (sourceToDestinationResourceLogicalIdMapping) {
      this.logger.debug(`Using provided resource mapping: ${Array.from(sourceToDestinationResourceLogicalIdMapping.entries())}`);
    } else {
      this.logger.debug('Building resource mapping...');
    }

    const gen1ToGen2ResourceLogicalIdMapping =
      sourceToDestinationResourceLogicalIdMapping ??
      this.buildGen1ToGen2ResourceLogicalIdMapping(gen1ResourcesToMove, gen2ResourcesToRemove);

    this.logger.debug('Cloning templates...');
    const clonedGen1Template = JSON.parse(JSON.stringify(gen1Template));
    const clonedGen2Template = JSON.parse(JSON.stringify(gen2Template));
    this.logger.debug(`Cloned Gen1 template resources: ${Object.keys(clonedGen1Template.Resources).length}`);
    this.logger.debug(`Cloned Gen2 template resources: ${Object.keys(clonedGen2Template.Resources).length}`);

    this.logger.debug('Adding Gen1 resources to Gen2 stack...');
    const gen2TemplateForRefactor = this.addGen1ResourcesToGen2Stack(
      clonedGen1Template,
      gen1LogicalResourceIds,
      gen1ToGen2ResourceLogicalIdMapping,
      clonedGen2Template,
    );

    this.logger.debug('Removing Gen1 resources from Gen1 stack...');
    const gen1TemplateForRefactor = this.removeGen1ResourcesFromGen1Stack(clonedGen1Template, gen1LogicalResourceIds);

    this.logger.debug('Refactor templates generated successfully');
    this.logger.debug(`Source template resources: ${Object.keys(gen1TemplateForRefactor.Resources).length}`);
    this.logger.debug(`Destination template resources: ${Object.keys(gen2TemplateForRefactor.Resources).length}`);

    return {
      sourceTemplate: gen1TemplateForRefactor,
      destinationTemplate: gen2TemplateForRefactor,
      logicalIdMapping: gen1ToGen2ResourceLogicalIdMapping,
    };
  }
}

export default CategoryTemplateGenerator;
