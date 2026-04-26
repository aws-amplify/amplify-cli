import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand } from '@aws-sdk/client-amplify';
import { SpinningLogger } from '../../../commands/gen2-migration/_infra/spinning-logger';
import { Gen1App } from '../../../commands/gen2-migration/generate/_infra/gen1-app';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_infra/validations';
import { detectTemplateDrift } from '../../../commands/drift-detection/detect-template-drift';

jest.mock('../../../commands/drift-detection/detect-template-drift', () => ({
  detectTemplateDrift: jest.fn(),
}));

jest.mock('@aws-sdk/client-appsync', () => ({
  ...jest.requireActual('@aws-sdk/client-appsync'),
  paginateListGraphqlApis: jest.fn().mockImplementation(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { graphqlApis: [{ name: 'testApp-testEnv', apiId: 'test-api-id' }] };
    },
  })),
}));
jest.mock('@aws-sdk/client-cloudformation', () => ({
  ...jest.requireActual('@aws-sdk/client-cloudformation'),
  waitUntilChangeSetCreateComplete: jest.fn().mockResolvedValue({}),
  waitUntilStackUpdateComplete: jest.fn().mockResolvedValue({}),
}));
jest.mock('@aws-sdk/client-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/client-dynamodb'),
  paginateListTables: jest.fn().mockImplementation(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { TableNames: ['Table1-test-api-id-testEnv', 'Table2-test-api-id-testEnv'] };
    },
  })),
}));
jest.mock('@aws-amplify/amplify-prompts', () => ({
  printer: { info: jest.fn(), blankLine: jest.fn(), success: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  AmplifySpinner: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    resetMessage: jest.fn(),
  })),
  isDebug: false,
}));

describe('AmplifyMigrationLockStep', () => {
  let lockStep: AmplifyMigrationLockStep;
  let mockCfnSend: jest.Mock;
  let mockAmplifySend: jest.Mock;
  let mockLogger: SpinningLogger;

  beforeEach(() => {
    mockCfnSend = jest.fn();
    mockAmplifySend = jest.fn();
    mockLogger = new SpinningLogger('mock');
    jest.spyOn(mockLogger, 'info').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'start').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'succeed').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'push').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'pop').mockImplementation(() => {});
    lockStep = new AmplifyMigrationLockStep(
      mockLogger,
      {
        appId: 'test-app-id',
        appName: 'testApp',
        rootStackName: 'test-root-stack',
        region: 'us-east-1',
        envName: 'testEnv',
        discover: () => [{ category: 'api', service: 'AppSync', resourceName: 'testApp', key: 'api:AppSync' as const }],
        resourceMetaOutput: () => 'test-api-id',
        clients: {
          cloudFormation: { send: mockCfnSend },
          amplify: { send: mockAmplifySend },
          appSync: { send: jest.fn() },
          dynamoDB: { send: jest.fn() },
        },
      } as unknown as Gen1App,
      {} as $TSContext,
      {
        validateDeploymentStatus: jest.fn().mockResolvedValue(undefined),
        validateDrift: jest.fn().mockResolvedValue(undefined),
      } as unknown as AmplifyGen2MigrationValidations,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const modelTemplate = { Resources: { TodoTable: { Type: 'AWS::DynamoDB::Table', Properties: {} } } };

  /** Mocks the forward() planning phase only (nested stack discovery + changeset creation for 2 model tables). */
  function setupForwardPlanningMocks() {
    mockCfnSend.mockResolvedValueOnce({
      StackResources: [
        {
          ResourceType: 'AWS::CloudFormation::Stack',
          LogicalResourceId: 'apitestApp',
          PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/api-stack/abc',
        },
      ],
    });
    mockCfnSend.mockResolvedValueOnce({
      StackResources: [
        {
          ResourceType: 'AWS::CloudFormation::Stack',
          LogicalResourceId: 'Table1',
          PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/model-stack-1/def',
        },
        {
          ResourceType: 'AWS::CloudFormation::Stack',
          LogicalResourceId: 'Table2',
          PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/model-stack-2/ghi',
        },
      ],
    });
    for (let i = 1; i <= 2; i++) {
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(modelTemplate) });
      mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: [{ ParameterKey: 'env', ParameterValue: 'testEnv' }] }] });
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({
        StackName: 'model-stack-' + i,
        ChangeSetName: 'cs',
        Changes: [{ ResourceChange: { Action: 'Modify', ResourceType: 'AWS::DynamoDB::Table', LogicalResourceId: 'TodoTable' } }],
      });
    }
  }

  describe('forward stack policy merge', () => {
    it('should append lock statement to empty stack policy', async () => {
      setupForwardPlanningMocks();
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});
      const plan = await lockStep.forward();
      await plan.execute();
      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(1);
      expect(setCalls[0][0].input).toEqual({
        StackName: 'test-root-stack',
        StackPolicyBody: JSON.stringify({ Statement: [{ Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' }] }),
      });
    });

    it('should append lock statement preserving existing statements', async () => {
      const existing = { Statement: [{ Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' }] };
      setupForwardPlanningMocks();
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(existing) });
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});
      const plan = await lockStep.forward();
      await plan.execute();
      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(1);
      expect(setCalls[0][0].input).toEqual({
        StackName: 'test-root-stack',
        StackPolicyBody: JSON.stringify({
          Statement: [
            { Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' },
            { Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' },
          ],
        }),
      });
    });

    it('should skip SetStackPolicy when lock statement already exists', async () => {
      const locked = { Statement: [{ Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' }] };
      setupForwardPlanningMocks();
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(locked) });
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});
      const plan = await lockStep.forward();
      await plan.execute();
      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(0);
    });
  });

  describe('forward env var merge', () => {
    it('should merge new env var with existing env vars', async () => {
      setupForwardPlanningMocks();
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: { EXISTING: 'value' } } }).mockResolvedValueOnce({});
      const plan = await lockStep.forward();
      await plan.execute();
      const updateCalls = mockAmplifySend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof UpdateAppCommand);
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0][0].input).toEqual({
        appId: 'test-app-id',
        environmentVariables: { EXISTING: 'value', GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' },
      });
    });
  });

  describe('rollback stack policy removal', () => {
    it('should remove lock statement and preserve customer statements', async () => {
      const policy = {
        Statement: [
          { Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' },
          { Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' },
        ],
      };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(policy) }).mockResolvedValueOnce({});
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' } } })
        .mockResolvedValueOnce({});
      const plan = await lockStep.rollback();
      await plan.execute();
      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(1);
      expect(setCalls[0][0].input).toEqual({
        StackName: 'test-root-stack',
        StackPolicyBody: JSON.stringify({
          Statement: [{ Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' }],
        }),
      });
    });

    it('should set allow-all when lock statement was the only one', async () => {
      const policy = { Statement: [{ Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' }] };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(policy) }).mockResolvedValueOnce({});
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' } } })
        .mockResolvedValueOnce({});
      const plan = await lockStep.rollback();
      await plan.execute();
      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(1);
      expect(setCalls[0][0].input).toEqual({
        StackName: 'test-root-stack',
        StackPolicyBody: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: 'Update:*', Principal: '*', Resource: '*' }] }),
      });
    });

    it('should skip SetStackPolicy when no existing policy (lock not found)', async () => {
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' } } })
        .mockResolvedValueOnce({});
      const plan = await lockStep.rollback();
      await plan.execute();
      expect(mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand)).toHaveLength(0);
    });

    it('should skip SetStackPolicy when lock statement is not found', async () => {
      const policy = { Statement: [{ Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' }] };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(policy) });
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' } } })
        .mockResolvedValueOnce({});
      const plan = await lockStep.rollback();
      await plan.execute();
      expect(mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand)).toHaveLength(0);
    });
  });

  describe('rollback env var removal', () => {
    it('should remove GEN2_MIGRATION_ENVIRONMENT_NAME and preserve other env vars', async () => {
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv', OTHER: 'keep' } } })
        .mockResolvedValueOnce({});
      const plan = await lockStep.rollback();
      await plan.execute();
      const updateCalls = mockAmplifySend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof UpdateAppCommand);
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0][0].input).toEqual({ appId: 'test-app-id', environmentVariables: { OTHER: 'keep' } });
    });
  });

  describe('rollback drift validation', () => {
    const mockDetectTemplateDrift = detectTemplateDrift as jest.MockedFunction<typeof detectTemplateDrift>;

    it('should pass validation when no drift is detected', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({ changes: [], skipped: false });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(true);
      expect(mockDetectTemplateDrift).toHaveBeenCalledWith('test-root-stack', mockLogger, expect.anything());
    });

    it('should pass validation when only DeletionPolicy drift exists', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'MyTable',
            ResourceType: 'AWS::DynamoDB::Table',
            Scope: ['DeletionPolicy'],
            Replacement: 'False',
          },
          {
            Action: 'Modify',
            LogicalResourceId: 'MyBucket',
            ResourceType: 'AWS::S3::Bucket',
            Scope: ['DeletionPolicy'],
            Replacement: 'False',
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });

    it('should fail validation when real drift exists alongside DeletionPolicy drift', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'MyTable',
            ResourceType: 'AWS::DynamoDB::Table',
            Scope: ['DeletionPolicy'],
            Replacement: 'False',
          },
          {
            Action: 'Modify',
            LogicalResourceId: 'MyFunction',
            ResourceType: 'AWS::Lambda::Function',
            Scope: ['Properties'],
            Replacement: 'False',
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when drift detection is skipped', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [],
        skipped: true,
        skipReason: 'Changeset creation failed',
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when drift detection throws an error', async () => {
      mockDetectTemplateDrift.mockRejectedValueOnce(new Error('CFN client error'));

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should not filter out Modify changes with multiple Scope entries that include DeletionPolicy', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'MyTable',
            ResourceType: 'AWS::DynamoDB::Table',
            Scope: ['DeletionPolicy', 'Properties'],
            Replacement: 'False',
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should not filter out Add or Remove actions even with DeletionPolicy scope', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Add',
            LogicalResourceId: 'NewResource',
            ResourceType: 'AWS::DynamoDB::Table',
            Scope: ['DeletionPolicy'],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when nested changes contain real drift at leaf level', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'authStack',
            ResourceType: 'AWS::CloudFormation::Stack',
            Scope: ['Properties'],
            nestedChanges: [
              {
                Action: 'Modify',
                LogicalResourceId: 'UserPool',
                ResourceType: 'AWS::Cognito::UserPool',
                Scope: ['Properties'],
              },
            ],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when incompleteStacks are reported', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [],
        skipped: false,
        incompleteStacks: ['storageactivity'],
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should pass validation when only cascading IAM Policy drift from DeletionPolicy change exists', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'TodoTable',
            ResourceType: 'AWS::DynamoDB::Table',
            Scope: ['DeletionPolicy'],
            Replacement: 'False',
          },
          {
            Action: 'Modify',
            LogicalResourceId: 'TodoIAMRoleDefaultPolicy7BBBF45B',
            ResourceType: 'AWS::IAM::Policy',
            Scope: ['Properties'],
            Details: [
              {
                ChangeSource: 'ResourceAttribute',
                Evaluation: 'Dynamic',
                Target: { Attribute: 'Properties', Name: 'PolicyDocument', RequiresRecreation: 'Never' },
                CausingEntity: 'TodoTable.Arn',
              },
            ],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });

    it('should fail validation when IAM Policy has a static/direct change mixed with dynamic', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'TodoIAMRoleDefaultPolicy7BBBF45B',
            ResourceType: 'AWS::IAM::Policy',
            Scope: ['Properties'],
            Details: [
              {
                ChangeSource: 'ResourceAttribute',
                Evaluation: 'Dynamic',
                Target: { Attribute: 'Properties', Name: 'PolicyDocument', RequiresRecreation: 'Never' },
                CausingEntity: 'TodoTable.Arn',
              },
              {
                ChangeSource: 'DirectModification',
                Evaluation: 'Static',
                Target: { Attribute: 'Properties', Name: 'PolicyDocument', RequiresRecreation: 'Never' },
              },
            ],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when IAM Policy change requires recreation', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'SomePolicy',
            ResourceType: 'AWS::IAM::Policy',
            Scope: ['Properties'],
            Details: [
              {
                ChangeSource: 'ResourceAttribute',
                Evaluation: 'Dynamic',
                Target: { Attribute: 'Properties', Name: 'PolicyDocument', RequiresRecreation: 'Conditionally' },
                CausingEntity: 'TodoTable.Arn',
              },
            ],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should pass validation when nested tree has only DeletionPolicy and cascading IAM drift', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'apiStack',
            ResourceType: 'AWS::CloudFormation::Stack',
            Scope: ['Properties'],
            nestedChanges: [
              {
                Action: 'Modify',
                LogicalResourceId: 'TodoTable',
                ResourceType: 'AWS::DynamoDB::Table',
                Scope: ['DeletionPolicy'],
              },
              {
                Action: 'Modify',
                LogicalResourceId: 'TodoIAMRoleDefaultPolicy',
                ResourceType: 'AWS::IAM::Policy',
                Scope: ['Properties'],
                Details: [
                  {
                    ChangeSource: 'ResourceAttribute',
                    Evaluation: 'Dynamic',
                    Target: { Attribute: 'Properties', RequiresRecreation: 'Never' },
                    CausingEntity: 'TodoTable.Arn',
                  },
                ],
              },
            ],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });

    it('should fail validation when IAM Policy cascading change is from a non-table resource', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'SomeLambdaPolicy',
            ResourceType: 'AWS::IAM::Policy',
            Scope: ['Properties'],
            Details: [
              {
                ChangeSource: 'ResourceAttribute',
                Evaluation: 'Dynamic',
                Target: { Attribute: 'Properties', Name: 'PolicyDocument', RequiresRecreation: 'Never' },
                CausingEntity: 'MyLambdaFunction.Arn',
              },
            ],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when a nested stack is added (Add action on CloudFormation::Stack)', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Add',
            LogicalResourceId: 'newUnexpectedStack',
            ResourceType: 'AWS::CloudFormation::Stack',
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should fail validation when a nested stack is removed (Remove action on CloudFormation::Stack)', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Remove',
            LogicalResourceId: 'authStack',
            ResourceType: 'AWS::CloudFormation::Stack',
            PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/auth-stack/abc',
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('should pass validation when CloudFormation::Stack wrapper has no nestedChanges', async () => {
      mockDetectTemplateDrift.mockResolvedValueOnce({
        changes: [
          {
            Action: 'Modify',
            LogicalResourceId: 'apiStack',
            ResourceType: 'AWS::CloudFormation::Stack',
            Scope: ['Properties'],
          },
        ],
        skipped: false,
      });

      const plan = await lockStep.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });
  });
});
