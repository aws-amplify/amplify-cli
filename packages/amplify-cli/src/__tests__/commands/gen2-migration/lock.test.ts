import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand } from '@aws-sdk/client-amplify';
import { SpinningLogger } from '../../../commands/gen2-migration/_common/spinning-logger';
import { Gen1App } from '../../../commands/gen2-migration/_common/gen1-app';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_common/validations';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../commands/gen2-migration/_common/resource-types';

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
        statefulResourceTypes: [...Array.from(DEFAULT_STATEFUL_RESOURCES)],
        discover: () => [{ category: 'api', service: 'AppSync', resourceName: 'testApp', key: 'api:AppSync' as const }],
        resourceMetaOutput: () => 'test-api-id',
        clients: {
          cloudFormation: { send: mockCfnSend },
          amplify: { send: mockAmplifySend },
          appSync: { send: jest.fn() },
          dynamoDB: { send: jest.fn() },
          s3: { send: jest.fn(), config: { region: () => 'us-east-1' } },
        },
        deploymentBucket: 'test-deployment-bucket',
        aws: {
          listNestedStacks: jest.fn().mockImplementation((stackName: string) => {
            if (stackName === 'test-root-stack') {
              return [
                {
                  LogicalResourceId: 'apitestApp',
                  PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/api-stack/abc',
                  ResourceType: 'AWS::CloudFormation::Stack',
                },
              ];
            }
            // api nested stack → model table stacks
            return [
              {
                LogicalResourceId: 'Table1',
                PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/model-stack-1/def',
                ResourceType: 'AWS::CloudFormation::Stack',
              },
              {
                LogicalResourceId: 'Table2',
                PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/model-stack-2/ghi',
                ResourceType: 'AWS::CloudFormation::Stack',
              },
            ];
          }),
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

  describe('rollback stack integrity validation', () => {
    let lockStepWithStorage: AmplifyMigrationLockStep;

    beforeEach(() => {
      lockStepWithStorage = new AmplifyMigrationLockStep(
        mockLogger,
        {
          appId: 'test-app-id',
          appName: 'testApp',
          rootStackName: 'test-root-stack',
          region: 'us-east-1',
          envName: 'testEnv',
          discover: () => [{ category: 'storage', service: 'DynamoDB', resourceName: 'myTable', key: 'storage:DynamoDB' as const }],
          resourceMetaOutput: () => undefined,
          json: () => ({
            Resources: {
              DynamoDBTable: { Type: 'AWS::DynamoDB::Table' },
              TablePolicy: { Type: 'AWS::IAM::Policy' },
            },
          }),
          clients: {
            cloudFormation: { send: mockCfnSend },
            amplify: { send: mockAmplifySend },
            appSync: { send: jest.fn() },
            dynamoDB: { send: jest.fn() },
            s3: { send: jest.fn(), config: { region: () => 'us-east-1' } },
          },
          deploymentBucket: 'test-deployment-bucket',
          aws: {
            listNestedStacks: jest.fn().mockResolvedValue([
              {
                LogicalResourceId: 'storagemyTable',
                PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:123:stack/storage-stack/abc',
                ResourceType: 'AWS::CloudFormation::Stack',
              },
            ]),
          },
        } as unknown as Gen1App,
        {} as $TSContext,
        {
          validateDeploymentStatus: jest.fn().mockResolvedValue(undefined),
          validateDrift: jest.fn().mockResolvedValue(undefined),
        } as unknown as AmplifyGen2MigrationValidations,
      );
    });

    it('should pass validation when all local resources exist in deployed template', async () => {
      // fetchTemplate for the nested stack
      mockCfnSend.mockResolvedValueOnce({
        TemplateBody: JSON.stringify({
          Resources: {
            DynamoDBTable: { Type: 'AWS::DynamoDB::Table' },
            TablePolicy: { Type: 'AWS::IAM::Policy' },
          },
        }),
      });

      const plan = await lockStepWithStorage.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });

    it('should fail validation when a resource is missing from the deployed template', async () => {
      // fetchTemplate - missing TablePolicy
      mockCfnSend.mockResolvedValueOnce({
        TemplateBody: JSON.stringify({
          Resources: {
            DynamoDBTable: { Type: 'AWS::DynamoDB::Table' },
          },
        }),
      });

      const plan = await lockStepWithStorage.rollback();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });
  });
});
