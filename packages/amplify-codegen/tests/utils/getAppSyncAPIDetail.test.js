const getAppSyncDetail = require('../../src/utils/getAppSyncAPIDetails');
const getAppSyncAPIs = require('../../src/utils/getAppSyncAPIs');

jest.mock('../../src/utils/getAppSyncAPIs');

describe('getAppSyncDetail', () => {
  const getProjectMeta = jest.fn();
  const context = {
    amplify: {
      getProjectMeta,
    },
  };

  const mockProjectMeta = { api: ['api1', 'api2'] };

  const mockAppSyncAPIs = [
    {
      name: 'api1',
      output: {
        GraphQLAPIEndpointOutput: 'http://appsync.aws.com/api1',
        GraphQLAPIIdOutput: 'some-random-id',
        securityType: 'AWS_IAM',
      },
    },
  ];

  it('should get the project meta from context', () => {
    getProjectMeta.mockReturnValueOnce(mockProjectMeta);
    getAppSyncAPIs.mockReturnValueOnce(mockAppSyncAPIs);
    const expectedResult = [
      {
        name: mockAppSyncAPIs[0].name,
        endpoint: mockAppSyncAPIs[0].output.GraphQLAPIEndpointOutput,
        id: mockAppSyncAPIs[0].output.GraphQLAPIIdOutput,
        securityType: mockAppSyncAPIs[0].output.securityType,
      },
    ];
    expect(getAppSyncDetail(context)).toEqual(expectedResult);
    expect(getProjectMeta).toHaveBeenCalled();
    expect(getAppSyncAPIs).toHaveBeenCalledWith(mockProjectMeta.api);
  });

  it('should return an empty list when there are no app sync APIs included in the project', () => {
    getProjectMeta.mockReturnValueOnce(mockProjectMeta);
    getAppSyncAPIs.mockReturnValueOnce([]);
    expect(getAppSyncDetail(context)).toHaveLength(0);
  });
});
