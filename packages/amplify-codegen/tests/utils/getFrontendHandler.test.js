const getFrontendHandler = require('../../src/utils/getFrontEndHandler');

describe('getFrontendHandler', () => {
  const mockFrontEndHandler = 'someRandomHandler';
  const mockProjectConfig = {
    frontendHandler: {
      [mockFrontEndHandler]: '/roo/amplify/package/node_modules/',
    },
  };
  const mockGetProjectConfig = jest.fn();
  const mockContext = {
    amplify: {
      getProjectConfig: mockGetProjectConfig,
    },
  };
  beforeEach(() => {
    mockGetProjectConfig.mockReturnValue(mockProjectConfig);
  });
  it('should get the frontend handler from the project config', () => {
    expect(getFrontendHandler(mockContext)).toEqual(mockFrontEndHandler);
    expect(mockGetProjectConfig).toHaveBeenCalled();
  });
});
