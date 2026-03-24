import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Logger } from '../../../commands/gen2-migration';

const mockValidateDeploymentStatus = jest.fn();
const mockValidateLockStatus = jest.fn();

jest.mock('../../../commands/gen2-migration/_validations', () => ({
  AmplifyGen2MigrationValidations: jest.fn().mockImplementation(() => ({
    validateDeploymentStatus: mockValidateDeploymentStatus,
    validateLockStatus: mockValidateLockStatus,
  })),
}));

const mockPaginateListStacks = jest.fn();
jest.mock('@aws-sdk/client-cloudformation', () => ({
  ...jest.requireActual('@aws-sdk/client-cloudformation'),
  CloudFormationClient: jest.fn().mockImplementation(() => ({})),
  paginateListStacks: (...args: unknown[]) => mockPaginateListStacks(...args),
}));

jest.mock('@aws-sdk/client-amplify');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-appsync');
jest.mock('@aws-sdk/client-cognito-identity-provider');

describe('AmplifyMigrationLockStep', () => {
  let lockStep: AmplifyMigrationLockStep;
  const mockContext = {} as $TSContext;
  const testAppId = 'test-app-id';

  beforeEach(() => {
    jest.clearAllMocks();
    lockStep = new AmplifyMigrationLockStep(
      new Logger('lock', 'test-app', 'dev'),
      'dev',
      'test-app',
      testAppId,
      'amplify-test-app-dev-123456',
      'us-east-1',
      mockContext,
    );
  });

  describe('rollbackValidate', () => {
    it('should pass when no holding stacks exist', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      mockValidateLockStatus.mockResolvedValue(undefined);
      mockPaginateListStacks.mockReturnValue(
        (async function* () {
          yield { StackSummaries: [] };
        })(),
      );

      await expect(lockStep.rollbackValidate()).resolves.not.toThrow();
      expect(mockValidateDeploymentStatus).toHaveBeenCalled();
      expect(mockValidateLockStatus).toHaveBeenCalled();
    });

    it('should throw MigrationError when holding stacks exist', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      mockValidateLockStatus.mockResolvedValue(undefined);
      mockPaginateListStacks.mockReturnValue(
        (async function* () {
          yield {
            StackSummaries: [{ StackName: `amplify-test-app-dev-auth-${testAppId}-abc123-holding` }],
          };
        })(),
      );

      await expect(lockStep.rollbackValidate()).rejects.toMatchObject({
        name: 'MigrationError',
        message: expect.stringContaining('Cannot roll back lock'),
        resolution: expect.stringContaining('refactor --rollback'),
      });
    });

    it('should propagate validateDeploymentStatus errors', async () => {
      const deploymentError = new Error('Stack not stable');
      deploymentError.name = 'StackStateError';
      mockValidateDeploymentStatus.mockRejectedValue(deploymentError);

      await expect(lockStep.rollbackValidate()).rejects.toThrow('Stack not stable');
      expect(mockValidateLockStatus).not.toHaveBeenCalled();
    });

    it('should propagate validateLockStatus errors', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      const lockError = new Error('Stack is not locked');
      lockError.name = 'MigrationError';
      mockValidateLockStatus.mockRejectedValue(lockError);

      await expect(lockStep.rollbackValidate()).rejects.toThrow('Stack is not locked');
    });

    it('should throw when multiple holding stacks exist', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      mockValidateLockStatus.mockResolvedValue(undefined);
      mockPaginateListStacks.mockReturnValue(
        (async function* () {
          yield {
            StackSummaries: [
              { StackName: `amplify-test-app-dev-auth-${testAppId}-abc123-holding` },
              { StackName: `amplify-test-app-dev-storage-${testAppId}-def456-holding` },
            ],
          };
        })(),
      );

      await expect(lockStep.rollbackValidate()).rejects.toMatchObject({
        name: 'MigrationError',
        message: expect.stringContaining('Cannot roll back lock'),
      });
    });

    it('should ignore holding stacks with a different appId', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      mockValidateLockStatus.mockResolvedValue(undefined);
      mockPaginateListStacks.mockReturnValue(
        (async function* () {
          yield {
            StackSummaries: [{ StackName: 'amplify-other-app-dev-auth-other-app-id-abc123-holding' }],
          };
        })(),
      );

      await expect(lockStep.rollbackValidate()).resolves.not.toThrow();
    });

    it('should ignore stacks that do not end with holding suffix', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      mockValidateLockStatus.mockResolvedValue(undefined);
      mockPaginateListStacks.mockReturnValue(
        (async function* () {
          yield {
            StackSummaries: [{ StackName: `amplify-test-app-dev-auth-${testAppId}-abc123` }],
          };
        })(),
      );

      await expect(lockStep.rollbackValidate()).resolves.not.toThrow();
    });

    it('should handle paginated results across multiple pages', async () => {
      mockValidateDeploymentStatus.mockResolvedValue(undefined);
      mockValidateLockStatus.mockResolvedValue(undefined);
      mockPaginateListStacks.mockReturnValue(
        (async function* () {
          yield { StackSummaries: [{ StackName: 'unrelated-stack' }] };
          yield {
            StackSummaries: [{ StackName: `amplify-test-app-dev-auth-${testAppId}-abc123-holding` }],
          };
        })(),
      );

      await expect(lockStep.rollbackValidate()).rejects.toMatchObject({
        name: 'MigrationError',
      });
    });
  });
});
