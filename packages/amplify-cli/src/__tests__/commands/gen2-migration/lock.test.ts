import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Logger } from '../../../commands/gen2-migration';

const mockValidateDeploymentStatus = jest.fn();
const mockValidateLockStatus = jest.fn();
const mockValidateTemplateDrift = jest.fn();

jest.mock('../../../commands/gen2-migration/_validations', () => ({
  AmplifyGen2MigrationValidations: jest.fn().mockImplementation(() => ({
    validateDeploymentStatus: mockValidateDeploymentStatus,
    validateLockStatus: mockValidateLockStatus,
    validateTemplateDrift: mockValidateTemplateDrift,
    validateDrift: jest.fn(),
  })),
}));

jest.mock('@aws-sdk/client-cloudformation');
jest.mock('@aws-sdk/client-amplify');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-appsync');
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getMeta: jest.fn().mockReturnValue({}),
  },
}));

describe('AmplifyMigrationLockStep - rollbackValidate', () => {
  let step: AmplifyMigrationLockStep;
  let mockContext: $TSContext;

  beforeEach(() => {
    mockContext = {} as $TSContext;
    step = new AmplifyMigrationLockStep(
      new Logger('lock', 'test-app', 'dev'),
      'dev',
      'test-app',
      'test-app-id',
      'amplify-test-stack',
      'us-east-1',
      mockContext,
    );
    jest.clearAllMocks();
  });

  it('should call all three validations in order', async () => {
    mockValidateDeploymentStatus.mockResolvedValue(undefined);
    mockValidateLockStatus.mockResolvedValue(undefined);
    mockValidateTemplateDrift.mockResolvedValue(undefined);

    await step.rollbackValidate();

    expect(mockValidateDeploymentStatus).toHaveBeenCalledTimes(1);
    expect(mockValidateLockStatus).toHaveBeenCalledTimes(1);
    expect(mockValidateTemplateDrift).toHaveBeenCalledTimes(1);
  });

  it('should propagate error when validateDeploymentStatus fails', async () => {
    const error = new Error('Stack not found');
    error.name = 'StackNotFoundError';
    mockValidateDeploymentStatus.mockRejectedValue(error);

    await expect(step.rollbackValidate()).rejects.toThrow('Stack not found');
    expect(mockValidateLockStatus).not.toHaveBeenCalled();
    expect(mockValidateTemplateDrift).not.toHaveBeenCalled();
  });

  it('should propagate error when validateLockStatus fails', async () => {
    mockValidateDeploymentStatus.mockResolvedValue(undefined);
    const error = new Error('Stack is not locked');
    error.name = 'MigrationError';
    mockValidateLockStatus.mockRejectedValue(error);

    await expect(step.rollbackValidate()).rejects.toThrow('Stack is not locked');
    expect(mockValidateDeploymentStatus).toHaveBeenCalledTimes(1);
    expect(mockValidateTemplateDrift).not.toHaveBeenCalled();
  });

  it('should propagate error when validateTemplateDrift fails', async () => {
    mockValidateDeploymentStatus.mockResolvedValue(undefined);
    mockValidateLockStatus.mockResolvedValue(undefined);
    const error = new Error('Template drift detected');
    error.name = 'MigrationError';
    mockValidateTemplateDrift.mockRejectedValue(error);

    await expect(step.rollbackValidate()).rejects.toThrow('Template drift detected');
    expect(mockValidateDeploymentStatus).toHaveBeenCalledTimes(1);
    expect(mockValidateLockStatus).toHaveBeenCalledTimes(1);
  });

  it('should pass when all validations succeed with no drift', async () => {
    mockValidateDeploymentStatus.mockResolvedValue(undefined);
    mockValidateLockStatus.mockResolvedValue(undefined);
    mockValidateTemplateDrift.mockResolvedValue(undefined);

    await expect(step.rollbackValidate()).resolves.not.toThrow();
  });
});
