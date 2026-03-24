import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_validations';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Logger } from '../../../commands/gen2-migration';

jest.mock('@aws-sdk/client-cloudformation');
jest.mock('bottleneck', () => {
  return jest.fn().mockImplementation(() => ({
    schedule: jest.fn((fn) => fn()),
  }));
});

const mockSyncCloudBackendFromS3 = jest.fn();
const mockGetClient = jest.fn();
jest.mock('../../../commands/drift-detection/services', () => ({
  CloudFormationService: jest.fn().mockImplementation(() => ({
    syncCloudBackendFromS3: mockSyncCloudBackendFromS3,
    getClient: mockGetClient,
  })),
}));

const mockDetectTemplateDrift = jest.fn();
jest.mock('../../../commands/drift-detection/detect-template-drift', () => ({
  detectTemplateDrift: (...args: any[]) => mockDetectTemplateDrift(...args),
}));

describe('AmplifyGen2MigrationValidations - validateTemplateDrift', () => {
  let mockContext: $TSContext;
  let validations: AmplifyGen2MigrationValidations;
  const mockCfnClient = {};

  beforeEach(() => {
    mockContext = {} as $TSContext;
    validations = new AmplifyGen2MigrationValidations(new Logger('mock', 'mock', 'mock'), 'amplify-test-stack', 'dev', mockContext);
    mockGetClient.mockResolvedValue(mockCfnClient);
    jest.clearAllMocks();
  });

  it('should pass when no template drift is detected', async () => {
    mockSyncCloudBackendFromS3.mockResolvedValue(true);
    mockDetectTemplateDrift.mockResolvedValue({
      changes: [],
      skipped: false,
    });

    await expect(validations.validateTemplateDrift()).resolves.not.toThrow();
    expect(mockSyncCloudBackendFromS3).toHaveBeenCalledWith(mockContext);
    expect(mockDetectTemplateDrift).toHaveBeenCalledWith('amplify-test-stack', expect.any(Object), mockCfnClient);
  });

  it('should throw MigrationError when template drift is detected', async () => {
    mockSyncCloudBackendFromS3.mockResolvedValue(true);
    mockDetectTemplateDrift.mockResolvedValue({
      changes: [{ LogicalResourceId: 'SomeResource', Action: 'Modify' }],
      skipped: false,
    });

    await expect(validations.validateTemplateDrift()).rejects.toMatchObject({
      name: 'MigrationError',
      message: 'Template drift detected',
    });
  });

  it('should throw MigrationError when S3 sync fails', async () => {
    mockSyncCloudBackendFromS3.mockResolvedValue(false);

    await expect(validations.validateTemplateDrift()).rejects.toMatchObject({
      name: 'MigrationError',
      message: 'Failed to sync cloud backend from S3',
      resolution: 'Ensure the project is deployed and S3 bucket is accessible.',
    });
    expect(mockDetectTemplateDrift).not.toHaveBeenCalled();
  });

  it('should throw MigrationError when template drift detection is skipped', async () => {
    mockSyncCloudBackendFromS3.mockResolvedValue(true);
    mockDetectTemplateDrift.mockResolvedValue({
      changes: [],
      skipped: true,
      skipReason: 'No cached CloudFormation template found',
    });

    await expect(validations.validateTemplateDrift()).rejects.toMatchObject({
      name: 'MigrationError',
      message: 'Template drift detection was skipped: No cached CloudFormation template found',
    });
  });

  it('should throw MigrationError when detection is skipped due to nested stack errors', async () => {
    mockSyncCloudBackendFromS3.mockResolvedValue(true);
    mockDetectTemplateDrift.mockResolvedValue({
      changes: [],
      skipped: true,
      skipReason: 'One or more nested stacks could not be analyzed',
    });

    await expect(validations.validateTemplateDrift()).rejects.toMatchObject({
      name: 'MigrationError',
      message: 'Template drift detection was skipped: One or more nested stacks could not be analyzed',
    });
  });

  it('should pass the correct stack name and CFN client to detectTemplateDrift', async () => {
    mockSyncCloudBackendFromS3.mockResolvedValue(true);
    mockDetectTemplateDrift.mockResolvedValue({
      changes: [],
      skipped: false,
    });

    await validations.validateTemplateDrift();

    expect(mockGetClient).toHaveBeenCalledWith(mockContext);
    expect(mockDetectTemplateDrift).toHaveBeenCalledWith(
      'amplify-test-stack',
      expect.objectContaining({
        info: expect.any(Function),
        debug: expect.any(Function),
        warn: expect.any(Function),
        blankLine: expect.any(Function),
        success: expect.any(Function),
        error: expect.any(Function),
      }),
      mockCfnClient,
    );
  });
});
