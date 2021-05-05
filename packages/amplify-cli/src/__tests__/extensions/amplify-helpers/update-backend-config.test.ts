import { stateManager } from 'amplify-cli-core';
import {
  updateBackendConfigAfterResourceAdd,
  updateBackendConfigAfterResourceUpdate,
  updateBackendConfigAfterResourceRemove,
} from '../../../extensions/amplify-helpers/update-backend-config';

jest.mock('amplify-cli-core');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

describe('update backend config', () => {
  const mockOption = {};
  beforeEach(() => {
    stateManager_mock.getBackendConfig.mockReturnValue({});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('after resource add', () => {
    updateBackendConfigAfterResourceAdd('testCategory', 'testResource', mockOption);
    expect(stateManager_mock.setBackendConfig.mock.calls[0][1].testCategory.testResource).toBeDefined();
  });
  test('after resource update', () => {
    updateBackendConfigAfterResourceUpdate('testCategory', 'testResource', 'testAttribute', 'testValue');
    expect(stateManager_mock.setBackendConfig.mock.calls[0][1].testCategory.testResource.testAttribute).toBe('testValue');
  });
  test('after resource remove', () => {
    updateBackendConfigAfterResourceRemove('testCategory', 'testResource');
    expect(stateManager_mock.setBackendConfig.mock.calls[0][1]).toEqual({});
  });
});

describe('update backend config after remove resource', () => {
  beforeAll(() => {
    stateManager_mock.getBackendConfig.mockReturnValue({
      testCategory: {
        testResource: {},
      },
    });
  });
  it('should remove property from backend config', () => {
    updateBackendConfigAfterResourceRemove('testCategory', 'testResource');
    expect(stateManager_mock.setBackendConfig.mock.calls[0][1]).toEqual({ testCategory: {} });
  });
});
