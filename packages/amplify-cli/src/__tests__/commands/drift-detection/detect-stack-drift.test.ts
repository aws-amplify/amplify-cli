import { type StackResourceDrift, type PropertyDifference } from '@aws-sdk/client-cloudformation';
import { isAmplifyRestApiDescriptionDrift, isAmplifyTriggerPolicyDrift } from '../../../commands/drift-detection/detect-stack-drift';
import type { Printer } from '@aws-amplify/amplify-prompts';

const mockPrinter: Printer = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  blankLine: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

function makeDrift(overrides: Partial<StackResourceDrift> = {}): StackResourceDrift {
  return {
    StackId: 'arn:aws:cloudformation:us-east-1:123:stack/test/guid',
    LogicalResourceId: 'TestResource',
    ResourceType: 'AWS::Lambda::Function',
    StackResourceDriftStatus: 'MODIFIED',
    PropertyDifferences: [],
    ...overrides,
  } as StackResourceDrift;
}

function makePropDiff(overrides: Partial<PropertyDifference> = {}): PropertyDifference {
  return {
    PropertyPath: '/SomeProperty',
    ExpectedValue: 'old',
    ActualValue: 'new',
    DifferenceType: 'NOT_EQUAL',
    ...overrides,
  };
}

describe('isAmplifyRestApiDescriptionDrift', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters RestApi Description drift where actual is null and expected is empty', () => {
    const drift = makeDrift({ ResourceType: 'AWS::ApiGateway::RestApi', LogicalResourceId: 'apinutritionapi' });
    const propDiff = makePropDiff({ PropertyPath: '/Description', ExpectedValue: '', ActualValue: 'null' });
    expect(isAmplifyRestApiDescriptionDrift(drift, propDiff, mockPrinter)).toBe(true);
  });

  it('ignores wrong property, wrong resource type, and genuine description changes', () => {
    const drift = makeDrift({ ResourceType: 'AWS::ApiGateway::RestApi' });
    // wrong property
    expect(
      isAmplifyRestApiDescriptionDrift(drift, makePropDiff({ PropertyPath: '/Name', ExpectedValue: '', ActualValue: 'null' }), mockPrinter),
    ).toBe(false);
    // wrong resource type
    expect(
      isAmplifyRestApiDescriptionDrift(
        makeDrift({ ResourceType: 'AWS::Lambda::Function' }),
        makePropDiff({ PropertyPath: '/Description', ExpectedValue: '', ActualValue: 'null' }),
        mockPrinter,
      ),
    ).toBe(false);
    // both non-null
    expect(
      isAmplifyRestApiDescriptionDrift(
        drift,
        makePropDiff({ PropertyPath: '/Description', ExpectedValue: 'old', ActualValue: 'new' }),
        mockPrinter,
      ),
    ).toBe(false);
  });
});

describe('isAmplifyTriggerPolicyDrift', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters Cognito trigger policy drift (AdminAddUserToGroup)', () => {
    const drift = makeDrift({ ResourceType: 'AWS::IAM::Role', LogicalResourceId: 'LambdaExecutionRole' });
    const policyValue = JSON.stringify({
      PolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:GetGroup', 'cognito-idp:CreateGroup'],
            Resource: 'arn:aws:cognito-idp:us-east-1:123:userpool/us-east-1_abc',
          },
        ],
      }),
      PolicyName: 'AddToGroupCognito',
    });
    const propDiff = makePropDiff({ PropertyPath: '/Policies/0', ExpectedValue: 'null', ActualValue: policyValue });
    expect(isAmplifyTriggerPolicyDrift(drift, propDiff, mockPrinter)).toBe(true);
  });

  it('filters S3 storage trigger policy drift', () => {
    const drift = makeDrift({ ResourceType: 'AWS::IAM::Role', LogicalResourceId: 'LambdaExecutionRole' });
    const policyValue = JSON.stringify({
      PolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          { Effect: 'Allow', Action: 's3:ListBucket', Resource: 'arn:aws:s3:::storagebucket-main' },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
            Resource: 'arn:aws:s3:::storagebucket-main/*',
          },
        ],
      }),
      PolicyName: 'amplify-lambda-execution-policy-storage',
    });
    const propDiff = makePropDiff({ PropertyPath: '/Policies/1', ExpectedValue: 'null', ActualValue: policyValue });
    expect(isAmplifyTriggerPolicyDrift(drift, propDiff, mockPrinter)).toBe(true);
  });

  it('ignores wrong resource type, wrong property path, and non-null expected value', () => {
    // wrong resource type
    expect(
      isAmplifyTriggerPolicyDrift(
        makeDrift({ ResourceType: 'AWS::IAM::Policy' }),
        makePropDiff({ PropertyPath: '/Policies/0', ExpectedValue: 'null', ActualValue: '{}' }),
        mockPrinter,
      ),
    ).toBe(false);
    // wrong property path
    expect(
      isAmplifyTriggerPolicyDrift(
        makeDrift({ ResourceType: 'AWS::IAM::Role' }),
        makePropDiff({ PropertyPath: '/AssumeRolePolicyDocument', ExpectedValue: 'null', ActualValue: '{}' }),
        mockPrinter,
      ),
    ).toBe(false);
    // expected is not null (policy already existed in template)
    const policyValue = JSON.stringify({ PolicyDocument: '{"Statement":[]}', PolicyName: 'amplify-lambda-execution-policy-storage' });
    expect(
      isAmplifyTriggerPolicyDrift(
        makeDrift({ ResourceType: 'AWS::IAM::Role' }),
        makePropDiff({ PropertyPath: '/Policies/0', ExpectedValue: 'some-existing-policy', ActualValue: policyValue }),
        mockPrinter,
      ),
    ).toBe(false);
  });

  it('does not filter unknown policy content', () => {
    const drift = makeDrift({ ResourceType: 'AWS::IAM::Role' });
    const policyValue = JSON.stringify({
      PolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Action: 'dynamodb:PutItem', Resource: '*' }],
      }),
      PolicyName: 'SomeCustomPolicy',
    });
    const propDiff = makePropDiff({ PropertyPath: '/Policies/0', ExpectedValue: 'null', ActualValue: policyValue });
    expect(isAmplifyTriggerPolicyDrift(drift, propDiff, mockPrinter)).toBe(false);
  });

  it('throws on malformed JSON', () => {
    const drift = makeDrift({ ResourceType: 'AWS::IAM::Role' });
    const propDiff = makePropDiff({ PropertyPath: '/Policies/0', ExpectedValue: 'null', ActualValue: 'not-json' });
    expect(() => isAmplifyTriggerPolicyDrift(drift, propDiff, mockPrinter)).toThrow();
  });
});
