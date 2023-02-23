import {
  updateBackendConfigAfterResourceAdd,
  updateBackendConfigAfterResourceUpdate,
  updateBackendConfigAfterResourceRemove,
  stateManager,
} from 'amplify-cli-core';

jest.spyOn(stateManager, 'getBackendConfig').mockReturnValue({});
jest.spyOn(stateManager, 'setBackendConfig').mockImplementation(() => {});
jest.spyOn(stateManager, 'getLocalEnvInfo').mockReturnValue({ envName: 'testEnv' });

describe('update backend config', () => {
  const mockOption = {};
  beforeEach(() => {
    (stateManager.getBackendConfig as jest.Mocked<any>).mockReturnValue({});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('after resource add', () => {
    updateBackendConfigAfterResourceAdd('testCategory', 'testResource', mockOption);
    expect((stateManager.setBackendConfig as jest.Mocked<any>).mock.calls[0][1].testCategory.testResource).toBeDefined();
  });
  test('after resource update', () => {
    updateBackendConfigAfterResourceUpdate('testCategory', 'testResource', 'testAttribute', 'testValue');
    expect((stateManager.setBackendConfig as jest.Mocked<any>).mock.calls[0][1].testCategory.testResource.testAttribute).toBe('testValue');
  });
  test('after resource remove', () => {
    updateBackendConfigAfterResourceRemove('testCategory', 'testResource');
    expect((stateManager.setBackendConfig as jest.Mocked<any>).mock.calls[0][1]).toEqual({});
  });
});

describe('update backend config after remove resource', () => {
  beforeAll(() => {
    (stateManager.getBackendConfig as jest.Mocked<any>).mockReturnValue({
      testCategory: {
        testResource: {},
      },
    });
  });
  it('should remove property from backend config', () => {
    updateBackendConfigAfterResourceRemove('testCategory', 'testResource');
    expect((stateManager.setBackendConfig as jest.Mocked<any>).mock.calls[0][1]).toEqual({ testCategory: {} });
  });
});
