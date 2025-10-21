import { CDKConstruct } from '../types/cdk-types';
import { ResourceType } from './gen2-target-mapper';

export interface ResourceDecision {
  resourceType: ResourceType;
  migrationStrategy: 'defineFunction' | 'defineCustom';
  complexity: 'simple' | 'complex';
  reason: string;
}

export interface DecisionCriteria {
  hasComplexConfiguration: boolean;
  hasCustomPolicies: boolean;
  hasEventSources: boolean;
  hasVPCConfiguration: boolean;
  hasLayers: boolean;
  hasEnvironmentVariables: boolean;
  hasCustomRuntime: boolean;
}

export class ResourceDecisionEngine {
  determineResourceType(construct: CDKConstruct): ResourceType {
    const typeMapping: Record<string, ResourceType> = {
      'AWS::Lambda::Function': ResourceType.LAMBDA,
      'lambda.Function': ResourceType.LAMBDA,
      Function: ResourceType.LAMBDA,

      'AWS::DynamoDB::Table': ResourceType.DYNAMODB,
      'dynamodb.Table': ResourceType.DYNAMODB,
      Table: ResourceType.DYNAMODB,

      'AWS::S3::Bucket': ResourceType.S3,
      's3.Bucket': ResourceType.S3,
      Bucket: ResourceType.S3,

      'AWS::SNS::Topic': ResourceType.SNS,
      'sns.Topic': ResourceType.SNS,
      Topic: ResourceType.SNS,

      'AWS::ApiGateway::RestApi': ResourceType.API_GATEWAY,
      'apigateway.RestApi': ResourceType.API_GATEWAY,
      RestApi: ResourceType.API_GATEWAY,

      'AWS::Events::Rule': ResourceType.EVENTBRIDGE,
      'events.Rule': ResourceType.EVENTBRIDGE,
      Rule: ResourceType.EVENTBRIDGE,

      'AWS::SQS::Queue': ResourceType.SQS,
      'sqs.Queue': ResourceType.SQS,
      Queue: ResourceType.SQS,

      'AWS::CloudFront::Distribution': ResourceType.CLOUDFRONT,
      'cloudfront.Distribution': ResourceType.CLOUDFRONT,
      Distribution: ResourceType.CLOUDFRONT,
    };

    return typeMapping[construct.type] || ResourceType.LAMBDA;
  }

  decideMigrationStrategy(construct: CDKConstruct): ResourceDecision {
    const resourceType = this.determineResourceType(construct);
    const criteria = this.analyzeCriteria(construct);

    switch (resourceType) {
      case ResourceType.LAMBDA:
        return this.decideLambdaStrategy(construct, criteria);

      case ResourceType.DYNAMODB:
      case ResourceType.S3:
      case ResourceType.SNS:
      case ResourceType.API_GATEWAY:
      case ResourceType.EVENTBRIDGE:
      case ResourceType.SQS:
      case ResourceType.CLOUDFRONT:
        return {
          resourceType,
          migrationStrategy: 'defineCustom',
          complexity: criteria.hasComplexConfiguration ? 'complex' : 'simple',
          reason: `${resourceType} resources always use defineCustom() in Gen2`,
        };

      default:
        return {
          resourceType,
          migrationStrategy: 'defineCustom',
          complexity: 'complex',
          reason: 'Unknown resource type, defaulting to defineCustom()',
        };
    }
  }

  private decideLambdaStrategy(construct: CDKConstruct, criteria: DecisionCriteria): ResourceDecision {
    const complexityFactors = [
      criteria.hasCustomPolicies,
      criteria.hasEventSources,
      criteria.hasVPCConfiguration,
      criteria.hasLayers,
      criteria.hasCustomRuntime,
    ];

    const complexityScore = complexityFactors.filter(Boolean).length;

    if (complexityScore === 0 && !criteria.hasComplexConfiguration) {
      return {
        resourceType: ResourceType.LAMBDA,
        migrationStrategy: 'defineFunction',
        complexity: 'simple',
        reason: 'Simple Lambda function with basic configuration',
      };
    }

    return {
      resourceType: ResourceType.LAMBDA,
      migrationStrategy: 'defineCustom',
      complexity: 'complex',
      reason: `Complex Lambda with ${complexityScore} advanced features: ${this.getComplexityReasons(criteria)}`,
    };
  }

  private analyzeCriteria(construct: CDKConstruct): DecisionCriteria {
    const props = construct.properties || {};

    return {
      hasComplexConfiguration: this.hasComplexConfig(props),
      hasCustomPolicies: Boolean(props.role || props.policies || props.managedPolicies),
      hasEventSources: Boolean(props.events || props.eventSourceMapping),
      hasVPCConfiguration: Boolean(props.vpc || props.vpcConfig),
      hasLayers: Boolean(props.layers && props.layers.length > 0),
      hasEnvironmentVariables: Boolean(props.environment && Object.keys(props.environment).length > 3),
      hasCustomRuntime: Boolean(props.runtime && !props.runtime.includes('NODEJS')),
    };
  }

  private hasComplexConfig(props: any): boolean {
    const complexFeatures = [
      'deadLetterQueue',
      'reservedConcurrency',
      'provisionedConcurrency',
      'fileSystemConfig',
      'imageConfig',
      'codeSigningConfig',
      'architectures',
    ];

    return complexFeatures.some((feature) => props[feature]);
  }

  private getComplexityReasons(criteria: DecisionCriteria): string {
    const reasons = [];

    if (criteria.hasCustomPolicies) reasons.push('custom policies');
    if (criteria.hasEventSources) reasons.push('event sources');
    if (criteria.hasVPCConfiguration) reasons.push('VPC config');
    if (criteria.hasLayers) reasons.push('layers');
    if (criteria.hasCustomRuntime) reasons.push('custom runtime');
    if (criteria.hasComplexConfiguration) reasons.push('advanced features');

    return reasons.join(', ');
  }

  getAllSupportedResourceTypes(): ResourceType[] {
    return [
      ResourceType.LAMBDA,
      ResourceType.DYNAMODB,
      ResourceType.S3,
      ResourceType.SNS,
      ResourceType.API_GATEWAY,
      ResourceType.EVENTBRIDGE,
      ResourceType.SQS,
      ResourceType.CLOUDFRONT,
    ];
  }

  getResourcePriority(): Record<ResourceType, number> {
    return {
      [ResourceType.LAMBDA]: 1,
      [ResourceType.DYNAMODB]: 2,
      [ResourceType.S3]: 3,
      [ResourceType.SNS]: 4,
      [ResourceType.API_GATEWAY]: 5,
      [ResourceType.EVENTBRIDGE]: 6,
      [ResourceType.SQS]: 7,
      [ResourceType.CLOUDFRONT]: 8,
    };
  }
}
