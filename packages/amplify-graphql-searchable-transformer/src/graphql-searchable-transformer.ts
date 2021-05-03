import { TransformerPluginBase, InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerModelProvider,
  TransformerPluginProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { EbsDeviceVolumeType } from '@aws-cdk/aws-ec2';
import { CfnDomain, Domain, ElasticsearchVersion } from '@aws-cdk/aws-elasticsearch';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Code, EventSourceMapping, Function, Runtime, StartingPosition } from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { CfnCondition, CfnParameter, FileAssetPackaging, Fn, Stack } from '@aws-cdk/core';
import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';
import { ModelResourceIDs, ResourceConstants, SearchableResourceIDs } from 'graphql-transformer-common';
import { createParametersStack as createParametersInStack } from './create-parameters';

const STACK_NAME = 'SearchableStack';
export class SearchableModelTransformer extends TransformerPluginBase {
  searchableObjectTypeDefinitions: ObjectTypeDefinitionNode[];
  constructor() {
    super(
      'amplify-searchable-transformer',
      /* GraphQL */ `
        directive @searchable(queries: SearchableQueryMap) on OBJECT
        input SearchableQueryMap {
          search: String
        }
      `,
    );
    this.searchableObjectTypeDefinitions = [];
  }

  generateResolvers = (context: TransformerContextProvider): void => {
    const {
      ElasticsearchDomainLogicalID,
      ElasticsearchAccessIAMRoleLogicalID,
      ElasticsearchDataSourceLogicalID,
      ElasticsearchStreamingLambdaFunctionLogicalID,
    } = ResourceConstants.RESOURCES;
    const {
      ElasticsearchInstanceCount,
      ElasticsearchInstanceType,
      ElasticsearchEBSVolumeGB,
      ElasticsearchStreamingFunctionName,
      S3DeploymentBucket,
      S3DeploymentRootKey,

      Env,
    } = ResourceConstants.PARAMETERS;
    const { HasEnvironmentParameter } = ResourceConstants.CONDITIONS;
    console.log('resolvers');

    const stack = context.stackManager.createStack(STACK_NAME);

    const envParam = context.stackManager.getParameter(Env) as CfnParameter;
    const deploymentKeyBucket = context.stackManager.getParameter(S3DeploymentBucket) as CfnParameter;
    const bucketrootkey = context.stackManager.getParameter(S3DeploymentRootKey) as CfnParameter;
    console.log(deploymentKeyBucket);
    const condition = new CfnCondition(stack, HasEnvironmentParameter, {
      expression: Fn.conditionNot(Fn.conditionEquals(envParam, 'NONE')),
    });

    stack.templateOptions.description = 'An auto-generated nested stack.';
    stack.templateOptions.templateFormatVersion = '2010-09-09';
    const parameterMap = createParametersInStack(stack);
    const domain = new Domain(stack, ElasticsearchDomainLogicalID, {
      version: ElasticsearchVersion.V6_2,
      ebs: {
        enabled: true,
        volumeType: EbsDeviceVolumeType.GP2,
        volumeSize: parameterMap.get(ElasticsearchEBSVolumeGB)?.valueAsNumber,
      },
      zoneAwareness: {
        enabled: false,
      },
      domainName: Fn.conditionIf(HasEnvironmentParameter, Fn.ref('AWS::NoValue'), Fn.join('-', ['d', context.api.apiId])).toString(),
    });

    (domain.node.defaultChild as CfnDomain).elasticsearchClusterConfig = {
      instanceCount: parameterMap.get(ElasticsearchInstanceCount)?.valueAsNumber,
      instanceType: parameterMap.get(ElasticsearchInstanceType)?.valueAsString,
    };
    const role = new Role(stack, ElasticsearchAccessIAMRoleLogicalID, {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
      roleName: ElasticsearchAccessIAMRoleLogicalID,
    });
    domain.grantRead(role);
    domain.grantWrite(role);

    context.api.addElasticSearchDataSource(
      ElasticsearchDataSourceLogicalID,
      stack.parseArn(domain.domainArn).region || stack.region,
      domain.domainEndpoint,
      {
        serviceRole: role,
        name: ElasticsearchDataSourceLogicalID,
      },
      stack,
    );
    // const deploymentBucket = Bucket.fromBucketArn(stack, "DeploymentBucket", deploymentKeyBucket.valueAsString);
    // for (const definition of this.searchableObjectTypeDefinitions) {

    //   const streamingFunction = new Function(stack, ElasticsearchStreamingLambdaFunctionLogicalID,
    //     {
    //       code: Code.fromBucket(deploymentBucket, Fn.join('/', [
    //         bucketrootkey.valueAsString,
    //         Fn.join('.', [
    //           parameterMap.get(ElasticsearchStreamingFunctionName)?.valueAsString || '',
    //           'zip'
    //         ])
    //       ])),
    //       runtime: Runtime.PYTHON_3_6,
    //       handler: "",
    //     }

    //   );

    //        const eventSourceMapping = new EventSourceMapping(
    //          stack,
    //          SearchableResourceIDs.SearchableEventSourceMappingID(definition.name.value),
    //          {
    //            batchSize: 1,
    //            enabled: true,
    //            startingPosition: StartingPosition.LATEST,
    //            eventSourceArn: '',
    //            target: streamingFunction,
    //          },

    //        );
    //      }
  };

  after = (context: TransformerContextProvider): void => {};

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode): void => {
    const modelDirective = definition?.directives?.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new InvalidDirectiveError('Types annotated with @searchable must also be annotated with @model.');
    }
    this.searchableObjectTypeDefinitions.push(definition);
  };
}

function getConditionParameters() {}
