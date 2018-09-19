const jetpack = require('fs-jetpack');
const path = require('path');

const downloadIntrospectionSchema = require('../../src/utils/downloadIntrospectionSchema');

jest.mock('fs-jetpack');

describe('downloadIntrospectionSchema', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();

  const mockIntroSchema = 'MOCK_INTROSPECTION_SCHEMA';
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
    },
  };
  const mockApiId = 'mock-api-123';
  const mockDownloadDirectory = 'MOCK_DOWNLOAD_DIRECTORY';

  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteProviderUtils.mockReturnValue(mockIntroSchema);
    mockGetProjectDetails.mockReturnValue({
      projectConfig: {
        projectPath: mockProjectPath,
      },
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
    expect(jetpack.dir).toHaveBeenCalledWith(mockDownloadDirectory);
    const expectedIntrospectionFileName = path.join(mockDownloadDirectory, 'schema.json');
    expect(jetpack.write).toHaveBeenCalledWith(expectedIntrospectionFileName, mockIntroSchema);

    expect(introSchemaPath).toEqual(path.relative(mockProjectPath, expectedIntrospectionFileName));
  });
});
