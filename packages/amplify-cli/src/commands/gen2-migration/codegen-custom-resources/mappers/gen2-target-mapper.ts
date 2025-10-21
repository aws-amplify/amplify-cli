import { CDKConstruct, CDKTable, CDKS3, CDKOutputs, AmplifyDependency } from '../types/cdk-types';
import { DefineCustom, Gen2Exports, Gen2EnvRef, Gen2ResourceRefs } from '../types/gen2-types';
import { CFNResource, CFNLambda, CFNTable, CFNS3 } from '../types/cloudformation-types';

export enum ResourceType {
  LAMBDA = 'lambda',
  DYNAMODB = 'dynamodb',
  S3 = 's3',
  SNS = 'sns',
  API_GATEWAY = 'apigateway',
  EVENTBRIDGE = 'eventbridge',
  SQS = 'sqs',
  CLOUDFRONT = 'cloudfront',
}

export interface Gen2TargetMapper {
  mapLambdaFunction(lambda: CDKConstruct | CFNLambda): DefineCustom | 'defineFunction';
  mapDynamoDB(table: CDKTable | CFNTable): DefineCustom;
  mapS3Bucket(bucket: CDKS3 | CFNS3): DefineCustom;
  mapSNSTopic(topic: CDKConstruct | CFNResource): DefineCustom;
  mapAPIGateway(api: CDKConstruct | CFNResource): DefineCustom;
  mapEventBridge(rule: CDKConstruct | CFNResource): DefineCustom;
  mapSQSQueue(queue: CDKConstruct | CFNResource): DefineCustom;
  mapCloudFront(distribution: CDKConstruct | CFNResource): DefineCustom;
  mapOutputs(outputs: CDKOutputs): Gen2Exports;
  mapEnvironment(env: string): Gen2EnvRef;
  mapCrossResourceDeps(deps: AmplifyDependency[]): Gen2ResourceRefs;
}

export class Gen2TargetMapperImpl implements Gen2TargetMapper {
  mapLambdaFunction(lambda: CDKConstruct | CFNLambda): DefineCustom | 'defineFunction' {
    const isSimple = this.isSimpleLambda(lambda);

    if (isSimple) {
      return 'defineFunction';
    }

    return {
      name: this.getResourceName(lambda),
      stack: `
        const lambdaFunction = new lambda.Function(stack, '${this.getResourceName(lambda)}', {
          ${this.mapLambdaProps(this.getResourceProperties(lambda))}
        });
        
        return {
          ${this.generateOutputReturns(lambda.outputs)}
        };
      `,
    };
  }

  mapDynamoDB(table: CDKTable | CFNTable): DefineCustom {
    return {
      name: this.getResourceName(table),
      stack: `
        const dynamoTable = new dynamodb.Table(stack, '${this.getResourceName(table)}', {
          ${this.mapDynamoProps(this.getResourceProperties(table))}
        });
        
        return {
          ${this.generateOutputReturns(table.outputs)}
        };
      `,
    };
  }

  mapS3Bucket(bucket: CDKS3 | CFNS3): DefineCustom {
    return {
      name: this.getResourceName(bucket),
      stack: `
        const s3Bucket = new s3.Bucket(stack, '${this.getResourceName(bucket)}', {
          ${this.mapS3Props(this.getResourceProperties(bucket))}
        });
        
        return {
          ${this.generateOutputReturns(bucket.outputs)}
        };
      `,
    };
  }

  mapSNSTopic(topic: CDKConstruct | CFNResource): DefineCustom {
    return {
      name: this.getResourceName(topic),
      stack: `
        const snsTopic = new sns.Topic(stack, '${this.getResourceName(topic)}', {
          ${this.mapSNSProps(this.getResourceProperties(topic))}
        });
        
        return {
          ${this.generateOutputReturns(topic.outputs)}
        };
      `,
    };
  }

  mapAPIGateway(api: CDKConstruct | CFNResource): DefineCustom {
    return {
      name: this.getResourceName(api),
      stack: `
        const restApi = new apigateway.RestApi(stack, '${this.getResourceName(api)}', {
          ${this.mapAPIProps(this.getResourceProperties(api))}
        });
        
        return {
          ${this.generateOutputReturns(api.outputs)}
        };
      `,
    };
  }

  mapEventBridge(rule: CDKConstruct | CFNResource): DefineCustom {
    return {
      name: this.getResourceName(rule),
      stack: `
        const eventRule = new events.Rule(stack, '${this.getResourceName(rule)}', {
          ${this.mapEventProps(this.getResourceProperties(rule))}
        });
        
        return {
          ${this.generateOutputReturns(rule.outputs)}
        };
      `,
    };
  }

  mapSQSQueue(queue: CDKConstruct | CFNResource): DefineCustom {
    return {
      name: this.getResourceName(queue),
      stack: `
        const sqsQueue = new sqs.Queue(stack, '${this.getResourceName(queue)}', {
          ${this.mapSQSProps(this.getResourceProperties(queue))}
        });
        
        return {
          ${this.generateOutputReturns(queue.outputs)}
        };
      `,
    };
  }

  mapCloudFront(distribution: CDKConstruct | CFNResource): DefineCustom {
    return {
      name: this.getResourceName(distribution),
      stack: `
        const cloudFrontDistribution = new cloudfront.Distribution(stack, '${this.getResourceName(distribution)}', {
          ${this.mapCloudFrontProps(this.getResourceProperties(distribution))}
        });
        
        return {
          ${this.generateOutputReturns(distribution.outputs)}
        };
      `,
    };
  }

  mapOutputs(outputs: CDKOutputs): Gen2Exports {
    const gen2Exports: Gen2Exports = {};

    outputs.forEach((output) => {
      gen2Exports[output.exportName] = {
        value: this.mapOutputValue(output.value),
        description: output.description,
      };
    });

    return gen2Exports;
  }

  mapEnvironment(env: string): Gen2EnvRef {
    const envMappings: Record<string, string> = {
      "${cdk.Fn.ref('env')}": 'process.env.AMPLIFY_ENV',
      '${AWS::StackName}': 'process.env.AMPLIFY_ENV',
      '${env}': 'process.env.AMPLIFY_ENV',
    };

    return {
      original: env,
      gen2Pattern: envMappings[env] || `process.env.${env.toUpperCase()}`,
    };
  }

  mapCrossResourceDeps(deps: AmplifyDependency[]): Gen2ResourceRefs {
    return deps.map((dep) => ({
      original: dep.resourceName,
      gen2Import: `import { ${dep.resourceName} } from './${dep.resourceName}';`,
      reference: `${dep.resourceName}.${dep.property}`,
    }));
  }

  private isSimpleLambda(lambda: CDKConstruct | CFNLambda): boolean {
    const complexFeatures = [
      'layers',
      'vpc',
      'deadLetterQueue',
      'reservedConcurrency',
      'eventSourceMapping',
      'customPolicies',
      'triggers',
      'Layers',
      'VpcConfig',
      'DeadLetterConfig',
      'ReservedConcurrencyConfig',
    ];

    const properties = this.isCFNResource(lambda) ? lambda.Properties : lambda.properties;

    return !complexFeatures.some((feature) => properties && properties[feature]);
  }

  private mapLambdaProps(props: any): string {
    const mappings = {
      runtime: props.runtime || 'lambda.Runtime.NODEJS_18_X',
      handler: props.handler || 'index.handler',
      code: props.code || "lambda.Code.fromAsset('lambda')",
      timeout: props.timeout || 'cdk.Duration.seconds(30)',
      memorySize: props.memorySize || '128',
      environment: this.mapEnvironmentVars(props.environment),
    };

    return Object.entries(mappings)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapDynamoProps(props: any): string {
    const mappings = {
      tableName: props.tableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      billingMode: props.billingMode || 'dynamodb.BillingMode.PAY_PER_REQUEST',
      removalPolicy: props.removalPolicy || 'cdk.RemovalPolicy.DESTROY',
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapS3Props(props: any): string {
    const mappings = {
      bucketName: props.bucketName,
      versioned: props.versioned || 'false',
      publicReadAccess: props.publicReadAccess || 'false',
      removalPolicy: props.removalPolicy || 'cdk.RemovalPolicy.DESTROY',
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapSNSProps(props: any): string {
    const mappings = {
      topicName: props.topicName,
      displayName: props.displayName,
      fifo: props.fifo || 'false',
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapAPIProps(props: any): string {
    const mappings = {
      restApiName: props.restApiName,
      description: props.description,
      deployOptions: props.deployOptions,
      defaultCorsPreflightOptions: props.cors,
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapEventProps(props: any): string {
    const mappings = {
      ruleName: props.ruleName,
      description: props.description,
      eventPattern: props.eventPattern,
      schedule: props.schedule,
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapSQSProps(props: any): string {
    const mappings = {
      queueName: props.queueName,
      visibilityTimeout: props.visibilityTimeout,
      receiveMessageWaitTime: props.receiveMessageWaitTime,
      fifo: props.fifo || 'false',
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapCloudFrontProps(props: any): string {
    const mappings = {
      defaultBehavior: props.defaultBehavior,
      additionalBehaviors: props.additionalBehaviors,
      certificate: props.certificate,
      domainNames: props.domainNames,
    };

    return Object.entries(mappings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(',\n          ');
  }

  private mapEnvironmentVars(env: any): string {
    if (!env) return '{}';

    const mapped = Object.entries(env).map(([key, value]) => {
      const mappedValue = typeof value === 'string' ? this.mapEnvironment(value).gen2Pattern : value;
      return `${key}: ${mappedValue}`;
    });

    return `{ ${mapped.join(', ')} }`;
  }

  private mapOutputValue(value: string): string {
    const mappings: Record<string, string> = {
      'cdk.Fn.ref': 'resource.ref',
      'cdk.Fn.getAtt': 'resource.getAtt',
      '${AWS::Region}': 'stack.region',
      '${AWS::AccountId}': 'stack.account',
    };

    let mappedValue = value;
    Object.entries(mappings).forEach(([pattern, replacement]) => {
      mappedValue = mappedValue.replace(new RegExp(pattern, 'g'), replacement);
    });

    return mappedValue;
  }

  private generateOutputReturns(outputs: any[]): string {
    if (!outputs || outputs.length === 0) return '';

    return outputs.map((output) => `${output.name}: ${output.value}`).join(',\n          ');
  }

  private isCFNResource(resource: any): resource is CFNResource {
    return resource.Type && resource.Properties;
  }

  private getResourceName(resource: CDKConstruct | CFNResource): string {
    if (this.isCFNResource(resource)) {
      return (resource as any).LogicalId || 'UnknownResource';
    }
    return resource.name;
  }

  private getResourceProperties(resource: CDKConstruct | CFNResource): any {
    if (this.isCFNResource(resource)) {
      return resource.Properties;
    }
    return resource.properties;
  }
}
