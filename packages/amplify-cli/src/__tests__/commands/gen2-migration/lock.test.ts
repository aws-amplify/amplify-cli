import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CreateChangeSetCommand, DeleteChangeSetCommand, SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand } from '@aws-sdk/client-amplify';
import { SpinningLogger } from '../../../commands/gen2-migration/_infra/spinning-logger';
import { Gen1App } from '../../../commands/gen2-migration/generate/_infra/gen1-app';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_infra/validations';

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
        discover: () => [{ category: 'api', service: 'AppSync', resourceName: 'testApp' }],
        metaOutput: () => 'test-api-id',
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

  describe('forward stack policy merge', () => {
    it('should append lock statement to empty stack policy', async () => {
      mockCfnSend
        .mockResolvedValueOnce({ StackResources: [] }) // DescribeStackResources for DeletionPolicy operation
        .mockResolvedValueOnce({ StackPolicyBody: undefined })
        .mockResolvedValueOnce({});
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});

      const plan = await lockStep.forward();
      await plan.execute();

      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(1);
      expect(setCalls[0][0].input).toEqual({
        StackName: 'test-root-stack',
        StackPolicyBody: JSON.stringify({
          Statement: [{ Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' }],
        }),
      });
    });

    it('should append lock statement preserving existing statements', async () => {
      const existingPolicy = {
        Statement: [{ Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' }],
      };
      mockCfnSend
        .mockResolvedValueOnce({ StackResources: [] }) // DescribeStackResources for DeletionPolicy operation
        .mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(existingPolicy) })
        .mockResolvedValueOnce({});
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
      const alreadyLockedPolicy = {
        Statement: [{ Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' }],
      };
      mockCfnSend
        .mockResolvedValueOnce({ StackResources: [] }) // DescribeStackResources for DeletionPolicy operation
        .mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(alreadyLockedPolicy) });
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});

      const plan = await lockStep.forward();
      await plan.execute();

      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(0);
    });
  });

  describe('forward env var merge', () => {
    it('should merge new env var with existing env vars', async () => {
      mockCfnSend
        .mockResolvedValueOnce({ StackResources: [] }) // DescribeStackResources for DeletionPolicy operation
        .mockResolvedValueOnce({ StackPolicyBody: undefined })
        .mockResolvedValueOnce({});
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
      const policyWithLock = {
        Statement: [
          { Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' },
          { Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' },
        ],
      };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(policyWithLock) }).mockResolvedValueOnce({});
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
      const policyWithOnlyLock = {
        Statement: [{ Effect: 'Deny', Action: 'Update:*', Principal: '*', Resource: '*' }],
      };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(policyWithOnlyLock) }).mockResolvedValueOnce({});
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
          Statement: [{ Effect: 'Allow', Action: 'Update:*', Principal: '*', Resource: '*' }],
        }),
      });
    });

    it('should skip SetStackPolicy when no existing policy (lock not found)', async () => {
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' } } })
        .mockResolvedValueOnce({});

      const plan = await lockStep.rollback();
      await plan.execute();

      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(0);
    });

    it('should skip SetStackPolicy when lock statement is not found', async () => {
      const customerPolicy = {
        Statement: [{ Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' }],
      };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(customerPolicy) });
      mockAmplifySend
        .mockResolvedValueOnce({ app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv' } } })
        .mockResolvedValueOnce({});

      const plan = await lockStep.rollback();
      await plan.execute();

      const setCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setCalls).toHaveLength(0);
    });
  });

  describe('rollback env var removal', () => {
    it('should remove GEN2_MIGRATION_ENVIRONMENT_NAME and preserve other env vars', async () => {
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockAmplifySend
        .mockResolvedValueOnce({
          app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv', OTHER: 'keep' } },
        })
        .mockResolvedValueOnce({});

      const plan = await lockStep.rollback();
      await plan.execute();

      const updateCalls = mockAmplifySend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof UpdateAppCommand);
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0][0].input).toEqual({
        appId: 'test-app-id',
        environmentVariables: { OTHER: 'keep' },
      });
    });
  });

  describe('forward DeletionPolicy changeset validation', () => {
    const modelTemplate = {
      Resources: {
        TodoTable: { Type: 'AWS::DynamoDB::Table', Properties: {} },
      },
    };

    function setupApiStackMocks() {
      // DescribeStackResources — root stack has one API nested stack
      mockCfnSend.mockResolvedValueOnce({
        StackResources: [
          {
            ResourceType: 'AWS::CloudFormation::Stack',
            LogicalResourceId: 'apitestapi',
            PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/api-stack/abc',
          },
        ],
      });
      // ListStackResources — API stack has one model nested stack
      mockCfnSend.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::CloudFormation::Stack',
            PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/model-stack/def',
          },
        ],
      });
      // GetTemplate — model stack template with DynamoDB table (no Retain)
      mockCfnSend.mockResolvedValueOnce({
        TemplateBody: JSON.stringify(modelTemplate),
      });
      // DescribeStacks — model stack parameters
      mockCfnSend.mockResolvedValueOnce({
        Stacks: [{ Parameters: [{ ParameterKey: 'env', ParameterValue: 'testEnv' }] }],
      });
      // CreateChangeSet
      mockCfnSend.mockResolvedValueOnce({});
    }

    it('should validate and proceed when only DynamoDB and IAM Policy Modify changes', async () => {
      setupApiStackMocks();
      // DescribeChangeSet — Modify on DynamoDB table + IAM policy (expected side effect)
      mockCfnSend.mockResolvedValueOnce({
        Changes: [
          { ResourceChange: { Action: 'Modify', ResourceType: 'AWS::DynamoDB::Table', LogicalResourceId: 'TodoTable' } },
          { ResourceChange: { Action: 'Modify', ResourceType: 'AWS::IAM::Policy', LogicalResourceId: 'TodoIAMRoleDefaultPolicy' } },
        ],
      });
      // DeleteChangeSet (cleanup)
      mockCfnSend.mockResolvedValueOnce({});
      // UpdateStack
      mockCfnSend.mockResolvedValueOnce({});
      // GetStackPolicy + SetStackPolicy for lock
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockCfnSend.mockResolvedValueOnce({});
      // Amplify env var
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});

      const plan = await lockStep.forward();
      await plan.execute();

      const createCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCalls).toHaveLength(1);
      const deleteCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof DeleteChangeSetCommand);
      expect(deleteCalls).toHaveLength(1);
    });

    it('should abort when changeset contains Add action', async () => {
      setupApiStackMocks();
      // DescribeChangeSet — unexpected Lambda change
      mockCfnSend.mockResolvedValueOnce({
        Changes: [{ ResourceChange: { Action: 'Add', ResourceType: 'AWS::Lambda::Function', LogicalResourceId: 'NewFunction' } }],
      });
      // DeleteChangeSet (cleanup in validation)
      mockCfnSend.mockResolvedValueOnce({});
      // GetStackPolicy + SetStackPolicy for lock (still runs after error is caught by runner)
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockCfnSend.mockResolvedValueOnce({});
      // Amplify env var
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});

      const plan = await lockStep.forward();
      await expect(plan.execute()).rejects.toMatchObject({
        name: 'MigrationError',
        message: expect.stringContaining('unexpected changes'),
      });
    });

    it('should abort when changeset contains Remove action on DynamoDB', async () => {
      setupApiStackMocks();
      // DescribeChangeSet — Remove on DynamoDB table
      mockCfnSend.mockResolvedValueOnce({
        Changes: [{ ResourceChange: { Action: 'Remove', ResourceType: 'AWS::DynamoDB::Table', LogicalResourceId: 'TodoTable' } }],
      });
      // DeleteChangeSet (cleanup in validation)
      mockCfnSend.mockResolvedValueOnce({});
      // GetStackPolicy + SetStackPolicy
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockCfnSend.mockResolvedValueOnce({});
      // Amplify env var
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});

      const plan = await lockStep.forward();
      await expect(plan.execute()).rejects.toMatchObject({
        name: 'MigrationError',
        message: expect.stringContaining('unexpected changes'),
      });
    });

    it('should abort when changeset contains Modify on unexpected resource type', async () => {
      setupApiStackMocks();
      // DescribeChangeSet — Modify on AppSync resolver (not in allowed set)
      mockCfnSend.mockResolvedValueOnce({
        Changes: [
          { ResourceChange: { Action: 'Modify', ResourceType: 'AWS::DynamoDB::Table', LogicalResourceId: 'TodoTable' } },
          { ResourceChange: { Action: 'Modify', ResourceType: 'AWS::AppSync::Resolver', LogicalResourceId: 'GetTodoResolver' } },
        ],
      });
      // DeleteChangeSet (cleanup in validation)
      mockCfnSend.mockResolvedValueOnce({});
      // GetStackPolicy + SetStackPolicy
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });
      mockCfnSend.mockResolvedValueOnce({});
      // Amplify env var
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: {} } }).mockResolvedValueOnce({});

      const plan = await lockStep.forward();
      await expect(plan.execute()).rejects.toMatchObject({
        name: 'MigrationError',
        message: expect.stringContaining('unexpected changes'),
      });
    });
  });
});
