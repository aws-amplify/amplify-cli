import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyClient, UpdateAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Logger } from '../../../commands/gen2-migration';

jest.mock('@aws-sdk/client-cloudformation', () => ({
  ...jest.requireActual('@aws-sdk/client-cloudformation'),
  CloudFormationClient: jest.fn(),
}));
jest.mock('@aws-sdk/client-amplify', () => ({
  ...jest.requireActual('@aws-sdk/client-amplify'),
  AmplifyClient: jest.fn(),
}));
jest.mock('@aws-sdk/client-appsync', () => ({
  ...jest.requireActual('@aws-sdk/client-appsync'),
  AppSyncClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  paginateListGraphqlApis: jest.fn().mockImplementation(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { graphqlApis: [{ name: 'testApp-testEnv', apiId: 'test-api-id' }] };
    },
  })),
}));
jest.mock('@aws-sdk/client-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/client-dynamodb'),
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  paginateListTables: jest.fn().mockImplementation(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { TableNames: ['Table1-test-api-id-testEnv', 'Table2-test-api-id-testEnv'] };
    },
  })),
}));
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  ...jest.requireActual('@aws-sdk/client-cognito-identity-provider'),
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getMeta: jest.fn().mockReturnValue({ auth: {} }),
  },
}));

const findOperation = async (operations: Awaited<ReturnType<AmplifyMigrationLockStep['execute']>>, substring: string) => {
  for (const op of operations) {
    const desc = await op.describe();
    if (desc.some((d) => d.includes(substring))) {
      return op;
    }
  }
  throw new Error(`Operation containing '${substring}' not found`);
};

describe('AmplifyMigrationLockStep', () => {
  let lockStep: AmplifyMigrationLockStep;
  let mockCfnSend: jest.Mock;
  let mockAmplifySend: jest.Mock;
  let mockLogger: Logger;

  beforeEach(() => {
    mockCfnSend = jest.fn();
    mockAmplifySend = jest.fn();

    (CloudFormationClient as jest.Mock).mockImplementation(() => ({ send: mockCfnSend }));
    (AmplifyClient as jest.Mock).mockImplementation(() => ({ send: mockAmplifySend }));
    (DynamoDBClient as jest.Mock).mockImplementation(() => ({ send: jest.fn() }));

    mockLogger = new Logger('mock', 'mock', 'mock');
    jest.spyOn(mockLogger, 'info').mockImplementation(() => {});

    lockStep = new AmplifyMigrationLockStep(
      mockLogger,
      'testEnv',
      'testApp',
      'test-app-id',
      'test-root-stack',
      'us-east-1',
      {} as $TSContext,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute stack policy merge', () => {
    it('should append lock statement to empty stack policy', async () => {
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined }).mockResolvedValueOnce({});

      const operations = await lockStep.execute();
      const lockOp = await findOperation(operations, 'Add lock statement');
      await lockOp.execute();

      const setCall = mockCfnSend.mock.calls[1][0];
      expect(setCall).toBeInstanceOf(SetStackPolicyCommand);
      expect(setCall.input).toEqual({
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
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(existingPolicy) }).mockResolvedValueOnce({});

      const operations = await lockStep.execute();
      const lockOp = await findOperation(operations, 'Add lock statement');
      await lockOp.execute();

      const setCall = mockCfnSend.mock.calls[1][0];
      expect(setCall.input).toEqual({
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
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(alreadyLockedPolicy) });

      const operations = await lockStep.execute();
      const lockOp = await findOperation(operations, 'Add lock statement');
      await lockOp.execute();

      // Only one call: GetStackPolicy. No SetStackPolicy because lock already exists.
      expect(mockCfnSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute env var merge', () => {
    it('should merge new env var with existing env vars', async () => {
      mockAmplifySend.mockResolvedValueOnce({ app: { environmentVariables: { EXISTING: 'value' } } }).mockResolvedValueOnce({});

      const operations = await lockStep.execute();
      const envOp = await findOperation(operations, 'Add environment variable');
      await envOp.execute();

      const updateCommand = mockAmplifySend.mock.calls[1][0];
      expect(updateCommand).toBeInstanceOf(UpdateAppCommand);
      expect(updateCommand.input).toEqual({
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

      const operations = await lockStep.rollback();
      const unlockOp = await findOperation(operations, 'Remove lock statement');
      await unlockOp.execute();

      const setCall = mockCfnSend.mock.calls[1][0];
      expect(setCall.input).toEqual({
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

      const operations = await lockStep.rollback();
      const unlockOp = await findOperation(operations, 'Remove lock statement');
      await unlockOp.execute();

      const setCall = mockCfnSend.mock.calls[1][0];
      expect(setCall.input).toEqual({
        StackName: 'test-root-stack',
        StackPolicyBody: JSON.stringify({
          Statement: [{ Effect: 'Allow', Action: 'Update:*', Principal: '*', Resource: '*' }],
        }),
      });
    });

    it('should skip SetStackPolicy when no existing policy (lock not found)', async () => {
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: undefined });

      const operations = await lockStep.rollback();
      const unlockOp = await findOperation(operations, 'Remove lock statement');
      await unlockOp.execute();

      // Only one call: GetStackPolicy. No SetStackPolicy because lock wasn't found.
      expect(mockCfnSend).toHaveBeenCalledTimes(1);
    });

    it('should skip SetStackPolicy when lock statement is not found', async () => {
      const customerPolicy = {
        Statement: [{ Effect: 'Deny', Action: 'Update:Replace', Principal: '*', Resource: 'LogicalResourceId/MyDB' }],
      };
      mockCfnSend.mockResolvedValueOnce({ StackPolicyBody: JSON.stringify(customerPolicy) });

      const operations = await lockStep.rollback();
      const unlockOp = await findOperation(operations, 'Remove lock statement');
      await unlockOp.execute();

      // Only one call: GetStackPolicy. No SetStackPolicy because lock wasn't found.
      expect(mockCfnSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('rollback env var removal', () => {
    it('should remove GEN2_MIGRATION_ENVIRONMENT_NAME and preserve other env vars', async () => {
      mockAmplifySend
        .mockResolvedValueOnce({
          app: { environmentVariables: { GEN2_MIGRATION_ENVIRONMENT_NAME: 'testEnv', OTHER: 'keep' } },
        })
        .mockResolvedValueOnce({});

      const operations = await lockStep.rollback();
      const envOp = await findOperation(operations, 'Remove environment variable');
      await envOp.execute();

      const updateCommand = mockAmplifySend.mock.calls[1][0];
      expect(updateCommand).toBeInstanceOf(UpdateAppCommand);
      expect(updateCommand.input).toEqual({
        appId: 'test-app-id',
        environmentVariables: { OTHER: 'keep' },
      });
    });
  });
});
