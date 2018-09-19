const isAppSyncApiPendingPush = require('../../src/utils/isAppSyncApiPendingPush');

const mockGetResourceStatus = jest.fn();
const MOCK_CONTEXT = {
  amplify: {
    getResourceStatus: mockGetResourceStatus,
  },
};

let resourceStatus = {};
describe('isAppSyncApiPendingPush', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resourceStatus = {
      resourcesToBeCreated: [],
      resourcesToBeUpdated: [],
      resourcesToBeDeleted: [],
    };
    mockGetResourceStatus.mockReturnValue(resourceStatus);
  });

  it('should return false if there is a resource to be created', async () => {
    const status = await isAppSyncApiPendingPush(MOCK_CONTEXT);
    expect(status).toBeFalsy();
  });

  it('should return false if pending push is a non AppSync resource', async () => {
    resourceStatus.resourcesToBeCreated = [
      {
        service: 'something else',
      },
    ];
    resourceStatus.resourcesToBeUpdated = [
      {
        service: 'something else',
      },
    ];
    resourceStatus.resourcesToBeDeleted = [
      {
        service: 'something else',
      },
    ];

    const status = await isAppSyncApiPendingPush(MOCK_CONTEXT);
    expect(status).toBeFalsy();
  });

  it('should return true if resourcesToBeCreated contains AppSync resource', async () => {
    resourceStatus.resourcesToBeCreated = [
      {
        service: 'AppSync',
      },
    ];

    const status = await isAppSyncApiPendingPush(MOCK_CONTEXT);
    expect(status).toBeTruthy();
  });

  it('should return true if resourcesToBeUpdated contains AppSync resource', async () => {
    resourceStatus.resourcesToBeUpdated = [
      {
        service: 'AppSync',
      },
    ];

    const status = await isAppSyncApiPendingPush(MOCK_CONTEXT);
    expect(status).toBeTruthy();
  });
});
