import CategoryTemplateGenerator from './category-template-generator';
import { CFN_S3_TYPE, CFNTemplate } from './types';
import { CloudFormationClient, DescribeStacksCommand, GetTemplateCommand, Parameter } from '@aws-sdk/client-cloudformation';

const mockCfnClientSendMock = jest.fn();

const GEN1_CATEGORY_STACK_ID = 'arn:aws:cloudformation:us-east-1:1234567890:stack/amplify-testauth-dev-12345-auth-ABCDE/12345';
const GEN2_CATEGORY_STACK_ID = 'arn:aws:cloudformation:us-east-1:1234567890:stack/amplify-mygen2app-test-sandbox-12345-auth-ABCDE/12345';
const GEN1_S3_BUCKET_LOGICAL_ID = 'S3Bucket';
const GEN2_S3_BUCKET_LOGICAL_ID = 'Gen2S3Bucket';
const GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID = 'MyOtherS3Bucket';
const GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID = 'MyOtherGen2S3Bucket';

const oldGen1Template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: { Ref: GEN1_S3_BUCKET_LOGICAL_ID },
    },
  },
  Resources: {
    [GEN1_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', { Ref: 'Environment' }]] },
      },
    },
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: { 'Fn::GetAtt': [GEN1_S3_BUCKET_LOGICAL_ID, 'Arn'] },
            },
          ],
        },
      },
    },
    [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [GEN1_S3_BUCKET_LOGICAL_ID],
    },
  },
};

const newGen1Template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: 'my-test-bucket-dev',
    },
  },
  Resources: {
    [GEN1_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', 'dev']] },
      },
    },
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
    [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [GEN1_S3_BUCKET_LOGICAL_ID],
    },
  },
};

const newGen1TemplateWithPredicate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: 'my-test-bucket-dev',
    },
  },
  Resources: {
    [GEN1_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', 'dev']] },
      },
    },
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
    [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [],
    },
  },
};

const oldGen2Template = {
  ...oldGen1Template,
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: { Ref: GEN2_S3_BUCKET_LOGICAL_ID },
    },
  },
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: { 'Fn::GetAtt': [GEN2_S3_BUCKET_LOGICAL_ID, 'Arn'] },
            },
          ],
        },
      },
    },
    [GEN2_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', { Ref: 'Environment' }]] },
      },
    },
    [GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket-2',
      },
      DependsOn: [GEN2_S3_BUCKET_LOGICAL_ID],
    },
  },
};
const newGen2Template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: 'my-test-bucket-dev',
    },
  },
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
  },
};
const gen1Params: Parameter[] = [
  {
    ParameterKey: 'Environment',
    ParameterValue: 'dev',
  },
];
const refactoredGen1Template: CFNTemplate = {
  ...newGen1Template,
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
  },
};

const refactoredGen2Template: CFNTemplate = {
  ...newGen2Template,
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
    [GEN2_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', 'dev']] },
      },
    },
    [GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [GEN2_S3_BUCKET_LOGICAL_ID],
    },
  },
};

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cloudformation'),
    CloudFormationClient: function () {
      return {
        send: mockCfnClientSendMock.mockImplementation((command) => {
          if (command instanceof DescribeStacksCommand) {
            return Promise.resolve({
              Stacks: [
                {
                  StackId: command.input.StackName,
                  Capabilities: ['CAPABILITY_NAMED_IAM'],
                  Tags: [
                    {
                      Key: 'amplify:category-stack',
                      Value: 'amplify-testauth-dev-12345-auth-ABCDE',
                    },
                  ],
                  CreationTime: new Date(),
                  LastUpdatedTime: new Date(),
                  DeletionTime: null,
                  StackStatus: 'CREATE_COMPLETE',
                  Parameters: gen1Params,
                  Outputs: [
                    {
                      OutputKey: 'BucketNameOutputRef',
                      OutputValue: 'my-test-bucket-dev',
                      Description: 'My bucket',
                    },
                  ],
                },
              ],
            });
          } else if (command instanceof GetTemplateCommand) {
            return Promise.resolve({
              TemplateBody:
                command.input.StackName === GEN1_CATEGORY_STACK_ID ? JSON.stringify(oldGen1Template) : JSON.stringify(oldGen2Template),
            });
          }
          return Promise.resolve({});
        }),
      };
    },
  };
});

describe('CategoryTemplateGenerator', () => {
  const s3TemplateGenerator = new CategoryTemplateGenerator(
    GEN1_CATEGORY_STACK_ID,
    GEN2_CATEGORY_STACK_ID,
    'us-east-1',
    '12345',
    new CloudFormationClient(),
    [CFN_S3_TYPE.Bucket],
  );

  const s3TemplateGeneratorWithPredicate = new CategoryTemplateGenerator(
    GEN1_CATEGORY_STACK_ID,
    GEN2_CATEGORY_STACK_ID,
    'us-east-1',
    '12345',
    new CloudFormationClient(),
    [CFN_S3_TYPE.Bucket],
    // decide which resources to move based on resource properties
    (resourcesToMove, resourceEntry) => resourcesToMove.includes(CFN_S3_TYPE.Bucket) && resourceEntry[0] === GEN1_S3_BUCKET_LOGICAL_ID,
  );

  it('should preprocess gen1 template prior to refactor', async () => {
    await expect(s3TemplateGenerator.generateGen1PreProcessTemplate()).resolves.toEqual({
      oldTemplate: oldGen1Template,
      newTemplate: newGen1Template,
      parameters: gen1Params,
    });
  });

  it('should preprocess gen1 template with predicate prior to refactor', async () => {
    await expect(s3TemplateGeneratorWithPredicate.generateGen1PreProcessTemplate()).resolves.toEqual({
      oldTemplate: oldGen1Template,
      newTemplate: newGen1TemplateWithPredicate,
      parameters: gen1Params,
    });
  });

  it('should remove gen2 resources from gen2 stack prior to refactor', async () => {
    await expect(s3TemplateGenerator.generateGen2ResourceRemovalTemplate()).resolves.toEqual({
      oldTemplate: oldGen2Template,
      newTemplate: newGen2Template,
      parameters: gen1Params,
    });
  });

  it('should refactor gen1 resources into gen2 stack', async () => {
    const { newTemplate: newGen1Template } = await s3TemplateGenerator.generateGen1PreProcessTemplate();
    const { newTemplate: newGen2Template } = await s3TemplateGenerator.generateGen2ResourceRemovalTemplate();
    const { sourceTemplate, destinationTemplate, logicalIdMapping } = s3TemplateGenerator.generateStackRefactorTemplates(
      newGen1Template,
      newGen2Template,
    );
    expect(sourceTemplate).toEqual<CFNTemplate>(refactoredGen1Template);
    expect(destinationTemplate).toEqual<CFNTemplate>(refactoredGen2Template);
    expect(logicalIdMapping).toEqual(
      new Map<string, string>([
        [GEN1_S3_BUCKET_LOGICAL_ID, GEN2_S3_BUCKET_LOGICAL_ID],
        [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID, GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID],
      ]),
    );
  });
});
