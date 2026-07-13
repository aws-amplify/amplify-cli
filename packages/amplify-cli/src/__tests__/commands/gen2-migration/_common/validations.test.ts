import { AmplifyGen2MigrationValidations } from '../../../../commands/gen2-migration/_common/validations';
import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { SpinningLogger } from '../../../../commands/gen2-migration/_common/spinning-logger';
import { Gen1App } from '../../../../commands/gen2-migration/_common/gen1-app';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getTeamProviderInfo: jest.fn(),
  },
}));

describe('AmplifyGen2MigrationValidations', () => {
  let mockContext: $TSContext;
  let validations: AmplifyGen2MigrationValidations;

  let mockCfnSend: jest.Mock;

  beforeEach(() => {
    mockContext = {} as $TSContext;
    mockCfnSend = jest.fn();
    const mockGen1App = {
      rootStackName: 'mock',
      envName: 'mock',
      clients: { cloudFormation: { send: mockCfnSend } },
    } as unknown as Gen1App;
    validations = new AmplifyGen2MigrationValidations(new SpinningLogger('mock', { debug: true }), mockGen1App, mockContext);
  });

  describe('validateDeploymentStatus', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw StackNotFoundError when stack not found in CloudFormation', async () => {
      mockCfnSend.mockResolvedValue({ Stacks: [] });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackNotFoundError',
        message: 'Stack mock not found in CloudFormation',
        resolution: 'Ensure the project is deployed.',
      });
    });

    it('should pass when stack status is UPDATE_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockCfnSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
      });

      await expect(validations.validateDeploymentStatus()).resolves.not.toThrow();
    });

    it('should pass when stack status is CREATE_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockCfnSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'CREATE_COMPLETE' }],
      });

      await expect(validations.validateDeploymentStatus()).resolves.not.toThrow();
    });

    it('should throw StackStateError when status is UPDATE_IN_PROGRESS', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockCfnSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'UPDATE_IN_PROGRESS' }],
      });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackStateError',
        message: 'Root stack status is UPDATE_IN_PROGRESS, expected UPDATE_COMPLETE or CREATE_COMPLETE',
        resolution: 'Complete the deployment before proceeding.',
      });
    });

    it('should throw StackStateError when status is ROLLBACK_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockCfnSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'ROLLBACK_COMPLETE' }],
      });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackStateError',
        message: 'Root stack status is ROLLBACK_COMPLETE, expected UPDATE_COMPLETE or CREATE_COMPLETE',
        resolution: 'Complete the deployment before proceeding.',
      });
    });
  });

  describe('validateLockStatus', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw MigrationError when stack is not locked', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockCfnSend.mockResolvedValue({ StackPolicyBody: undefined });

      await expect(validations.validateLockStatus()).rejects.toMatchObject({
        name: 'StackPolicyError',
        message: 'Stack is not locked',
        resolution: 'Run the lock command before proceeding with migration.',
      });
    });

    it('should pass when stack has correct lock policy', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const expectedPolicy = {
        Statement: [
          {
            Effect: 'Deny',
            Action: 'Update:*',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockCfnSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(expectedPolicy),
      });

      await expect(validations.validateLockStatus()).resolves.not.toThrow();
    });

    it('should pass when lock statement exists alongside other statements', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const policyWithBoth = {
        Statement: [
          {
            Effect: 'Allow',
            Action: 'Update:*',
            Principal: '*',
            Resource: '*',
          },
          {
            Effect: 'Deny',
            Action: 'Update:*',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockCfnSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(policyWithBoth),
      });

      await expect(validations.validateLockStatus()).resolves.not.toThrow();
    });

    it('should throw StackPolicyError when stack policy has wrong effect', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const wrongPolicy = {
        Statement: [
          {
            Effect: 'Allow',
            Action: 'Update:*',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockCfnSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(wrongPolicy),
      });

      await expect(validations.validateLockStatus()).rejects.toMatchObject({
        name: 'StackPolicyError',
        message: 'Stack policy does not match expected lock policy',
        resolution: 'Run the lock command to set the correct stack policy.',
      });
    });

    it('should throw MigrationError when stack policy has different action', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const wrongPolicy = {
        Statement: [
          {
            Effect: 'Deny',
            Action: 'Update:Delete',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockCfnSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(wrongPolicy),
      });

      await expect(validations.validateLockStatus()).rejects.toMatchObject({
        name: 'StackPolicyError',
        message: 'Stack policy does not match expected lock policy',
        resolution: 'Run the lock command to set the correct stack policy.',
      });
    });
  });
});
