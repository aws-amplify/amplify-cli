const fs = require('fs-extra');
const path = require('path');

const downloadIntrospectionSchema = require('../../src/utils/downloadIntrospectionSchema');

jest.mock('fs-extra');

describe('downloadIntrospectionSchema', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetEnvInfo = jest.fn();

  const mockIntroSchema = 'MOCK_INTROSPECTION_SCHEMA';
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getEnvInfo: mockGetEnvInfo,

    },
  };
  const mockApiId = 'mock-api-123';
  const mockDownloadDirectory = 'MOCK_DOWNLOAD_DIRECTORY';

  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteProviderUtils.mockReturnValue(mockIntroSchema);
    mockGetEnvInfo.mockReturnValue({
      projectPath: mockProjectPath,
    });
  });
  it('should download the schema', async () => {
    const introSchemaPath = await downloadIntrospectionSchema(
      mockContext,
      mockApiId,
      path.join(mockDownloadDirectory, 'schema.json'),
    );
    expect(mockExecuteProviderUtils).toHaveBeenCalledWith(
      mockContext,
      'awscloudformation',
      'getIntrospectionSchema',
      { apiId: mockApiId },
    );
    expect(fs.ensureDirSync).toHaveBeenCalledWith(mockDownloadDirectory);
    const expectedIntrospectionFileName = path.join(mockDownloadDirectory, 'schema.json');
    expect(fs.writeFileSync).toHaveBeenCalledWith(expectedIntrospectionFileName, mockIntroSchema, 'utf8');

    expect(introSchemaPath).toEqual(path.relative(mockProjectPath, expectedIntrospectionFileName));
  });
});
