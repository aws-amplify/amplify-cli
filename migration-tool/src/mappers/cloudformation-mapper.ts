import { CFNResource, CFNIntrinsic, CFNRef, CFNTemplate } from '../types/cloudformation-types';
import { CDKConstruct } from '../types/cdk-types';
import { Gen2EnvRef } from '../types/gen2-types';

export interface CloudFormationMapper {
  mapCFNResourceToCDK(cfnResource: CFNResource): CDKConstruct;
  mapIntrinsicFunctions(intrinsics: CFNIntrinsic[]): string[];
  mapCloudFormationRefs(refs: CFNRef[]): string[];
  mapCFNOutputsToGen2(outputs: Record<string, any>): Record<string, any>;
}

export class CloudFormationMapperImpl implements CloudFormationMapper {
  mapCFNResourceToCDK(cfnResource: CFNResource): CDKConstruct {
    const cdkType = this.mapResourceType(cfnResource.Type);

    return {
      name: (cfnResource as any).LogicalId || 'UnknownResource',
      type: cdkType,
      properties: this.mapProperties(cfnResource.Properties, cfnResource.Type),
      outputs: this.extractOutputs(cfnResource),
    };
  }

  mapIntrinsicFunctions(intrinsics: CFNIntrinsic[]): string[] {
    return intrinsics.map((intrinsic) => {
      switch (intrinsic.function) {
        case 'Ref':
          return this.mapRef(intrinsic.parameters[0]);

        case 'Fn::GetAtt':
        case '!GetAtt':
          return this.mapGetAtt(intrinsic.parameters);

        case 'Fn::Sub':
        case '!Sub':
          return this.mapSub(intrinsic.parameters[0]);

        case 'Fn::Join':
        case '!Join':
          return this.mapJoin(intrinsic.parameters);

        case 'Fn::Split':
        case '!Split':
          return this.mapSplit(intrinsic.parameters);

        default:
          return `// TODO: Map ${intrinsic.function}`;
      }
    });
  }

  mapCloudFormationRefs(refs: CFNRef[]): string[] {
    return refs.map((ref) => {
      switch (ref.intrinsicType) {
        case 'Ref':
          return this.mapRef(ref.resourceName);

        case 'GetAtt':
          return `${ref.resourceName}.${ref.property}`;

        default:
          return `${ref.resourceName}.ref`;
      }
    });
  }

  mapCFNOutputsToGen2(outputs: Record<string, any>): Record<string, any> {
    const gen2Exports: Record<string, any> = {};

    Object.entries(outputs).forEach(([key, output]) => {
      gen2Exports[key] = {
        value: this.mapOutputValue(output.Value),
        description: output.Description,
      };
    });

    return gen2Exports;
  }

  private mapResourceType(cfnType: string): string {
    const typeMapping: Record<string, string> = {
      'AWS::Lambda::Function': 'lambda.Function',
      'AWS::DynamoDB::Table': 'dynamodb.Table',
      'AWS::S3::Bucket': 's3.Bucket',
      'AWS::SNS::Topic': 'sns.Topic',
      'AWS::ApiGateway::RestApi': 'apigateway.RestApi',
      'AWS::Events::Rule': 'events.Rule',
      'AWS::SQS::Queue': 'sqs.Queue',
      'AWS::CloudFront::Distribution': 'cloudfront.Distribution',
      'AWS::IAM::Role': 'iam.Role',
      'AWS::IAM::Policy': 'iam.Policy',
    };

    return typeMapping[cfnType] || cfnType;
  }

  private mapProperties(properties: Record<string, any>, resourceType: string): Record<string, any> {
    const mapped: Record<string, any> = {};

    Object.entries(properties).forEach(([key, value]) => {
      mapped[this.mapPropertyName(key, resourceType)] = this.mapPropertyValue(value);
    });

    return mapped;
  }

  private mapPropertyName(cfnProperty: string, resourceType: string): string {
    // Resource-specific property mappings
    const lambdaMappings: Record<string, string> = {
      FunctionName: 'functionName',
      Runtime: 'runtime',
      Handler: 'handler',
      Code: 'code',
      Environment: 'environment',
      VpcConfig: 'vpc',
      Layers: 'layers',
    };

    const dynamoMappings: Record<string, string> = {
      TableName: 'tableName',
      AttributeDefinitions: 'attributeDefinitions',
      KeySchema: 'keySchema',
      BillingMode: 'billingMode',
      GlobalSecondaryIndexes: 'globalSecondaryIndexes',
    };

    const s3Mappings: Record<string, string> = {
      BucketName: 'bucketName',
      VersioningConfiguration: 'versioned',
      PublicAccessBlockConfiguration: 'publicReadAccess',
      CorsConfiguration: 'cors',
    };

    switch (resourceType) {
      case 'AWS::Lambda::Function':
        return lambdaMappings[cfnProperty] || cfnProperty.toLowerCase();
      case 'AWS::DynamoDB::Table':
        return dynamoMappings[cfnProperty] || cfnProperty.toLowerCase();
      case 'AWS::S3::Bucket':
        return s3Mappings[cfnProperty] || cfnProperty.toLowerCase();
      default:
        return cfnProperty.toLowerCase();
    }
  }

  private mapPropertyValue(value: any): any {
    if (typeof value === 'object' && value !== null) {
      // Handle intrinsic functions in property values
      if (value.Ref) {
        return this.mapRef(value.Ref);
      }

      if (value['Fn::GetAtt']) {
        return this.mapGetAtt(value['Fn::GetAtt']);
      }

      if (value['Fn::Sub']) {
        return this.mapSub(value['Fn::Sub']);
      }

      // Recursively map nested objects
      const mapped: Record<string, any> = {};
      Object.entries(value).forEach(([k, v]) => {
        mapped[k] = this.mapPropertyValue(v);
      });
      return mapped;
    }

    return value;
  }

  private mapRef(resourceName: string): string {
    // Map AWS pseudo parameters
    const pseudoParameters: Record<string, string> = {
      'AWS::Region': 'stack.region',
      'AWS::AccountId': 'stack.account',
      'AWS::StackName': 'process.env.AMPLIFY_ENV',
      'AWS::StackId': 'stack.stackId',
    };

    return pseudoParameters[resourceName] || `${resourceName}.ref`;
  }

  private mapGetAtt(parameters: any[]): string {
    if (Array.isArray(parameters) && parameters.length === 2) {
      const [resourceName, attributeName] = parameters;
      return `${resourceName}.${attributeName.toLowerCase()}`;
    }

    return `${parameters[0]}.getAtt('${parameters[1]}')`;
  }

  private mapSub(template: string): string {
    if (typeof template !== 'string') {
      return template;
    }

    let result = template;

    // Replace AWS pseudo parameters
    result = result.replace(/\$\{AWS::Region\}/g, '${stack.region}');
    result = result.replace(/\$\{AWS::AccountId\}/g, '${stack.account}');
    result = result.replace(/\$\{AWS::StackName\}/g, '${process.env.AMPLIFY_ENV}');

    // Replace resource references
    result = result.replace(/\$\{(\w+)\}/g, '${$1.ref}');

    return `\`${result}\``;
  }

  private mapJoin(parameters: any[]): string {
    if (Array.isArray(parameters) && parameters.length === 2) {
      const [delimiter, values] = parameters;
      const mappedValues = values.map((v: any) => this.mapPropertyValue(v));
      return `[${mappedValues.map((v) => JSON.stringify(v)).join(', ')}].join('${delimiter}')`;
    }

    return `[${parameters[1].join(', ')}].join('${parameters[0]}')`;
  }

  private mapSplit(parameters: any[]): string {
    if (Array.isArray(parameters) && parameters.length === 2) {
      const [delimiter, sourceString] = parameters;
      const mappedSource = this.mapPropertyValue(sourceString);
      return `${mappedSource}.split('${delimiter}')`;
    }

    return `${parameters[1]}.split('${parameters[0]}')`;
  }

  private mapOutputValue(value: any): string {
    if (typeof value === 'object' && value !== null) {
      if (value.Ref) {
        return this.mapRef(value.Ref);
      }

      if (value['Fn::GetAtt']) {
        return this.mapGetAtt(value['Fn::GetAtt']);
      }

      if (value['Fn::Sub']) {
        return this.mapSub(value['Fn::Sub']);
      }
    }

    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private extractOutputs(cfnResource: CFNResource): any[] {
    // Extract potential outputs based on resource type
    const outputs: any[] = [];

    switch (cfnResource.Type) {
      case 'AWS::Lambda::Function':
        outputs.push(
          { name: 'functionArn', value: 'lambdaFunction.functionArn' },
          { name: 'functionName', value: 'lambdaFunction.functionName' },
        );
        break;

      case 'AWS::DynamoDB::Table':
        outputs.push({ name: 'tableArn', value: 'dynamoTable.tableArn' }, { name: 'tableName', value: 'dynamoTable.tableName' });
        break;

      case 'AWS::S3::Bucket':
        outputs.push({ name: 'bucketArn', value: 's3Bucket.bucketArn' }, { name: 'bucketName', value: 's3Bucket.bucketName' });
        break;
    }

    return outputs;
  }
}
