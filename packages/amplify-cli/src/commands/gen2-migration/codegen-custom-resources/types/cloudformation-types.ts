export interface CFNResource {
  Type: string;
  Properties: Record<string, any>;
  DependsOn?: string | string[];
  Condition?: string;
  Metadata?: Record<string, any>;
}

export interface CFNTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, CFNParameter>;
  Conditions?: Record<string, any>;
  Resources: Record<string, CFNResource>;
  Outputs?: Record<string, CFNOutput>;
}

export interface CFNParameter {
  Type: string;
  Default?: any;
  Description?: string;
  AllowedValues?: any[];
  MinLength?: number;
  MaxLength?: number;
}

export interface CFNOutput {
  Value: any;
  Description?: string;
  Export?: {
    Name: string;
  };
}

export interface CFNIntrinsic {
  function: string;
  parameters: any[];
  context: string;
}

export interface CFNRef {
  resourceName: string;
  property?: string;
  intrinsicType: 'Ref' | 'GetAtt' | 'Sub' | 'Join' | 'Split';
  context?: string;
}

export interface CFNLambda extends CFNResource {
  Type: 'AWS::Lambda::Function';
  Properties: {
    Runtime: string;
    Handler: string;
    Code: any;
    FunctionName?: string;
    Environment?: {
      Variables?: Record<string, any>;
    };
    VpcConfig?: any;
    Layers?: string[];
    DeadLetterConfig?: any;
  };
}

export interface CFNTable extends CFNResource {
  Type: 'AWS::DynamoDB::Table';
  Properties: {
    TableName?: string;
    AttributeDefinitions: Array<{
      AttributeName: string;
      AttributeType: string;
    }>;
    KeySchema: Array<{
      AttributeName: string;
      KeyType: string;
    }>;
    BillingMode?: string;
    GlobalSecondaryIndexes?: any[];
    StreamSpecification?: any;
  };
}

export interface CFNS3 extends CFNResource {
  Type: 'AWS::S3::Bucket';
  Properties: {
    BucketName?: string;
    VersioningConfiguration?: any;
    PublicAccessBlockConfiguration?: any;
    CorsConfiguration?: any;
    LifecycleConfiguration?: any;
    NotificationConfiguration?: any;
  };
}
