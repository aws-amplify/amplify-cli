import { getResourceOutputs } from '../../../extensions/amplify-helpers/get-resource-outputs';
import { stateManager } from 'amplify-cli-core';
import mockAmplifyMetaJson from './testData/mockMetaData/mock-amplify-meta.json';
import expectedResponse from './testData/mockMetaData/response-mock-amplify-meta.json';

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getMeta: jest.fn().mockImplementation(() => mockAmplifyMetaJson),
  },
}));

describe('getResourceOutputs', () => {
  const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
  it('should return the correct object', () => {
    const received = getResourceOutputs(mockAmplifyMetaJson);
    expect(received).toStrictEqual(expectedResponse);
  });
  it('should return the correct object if amplifyMeta is null', () => {
    const received = getResourceOutputs(null);
    expect(stateManagerMock.getMeta).toHaveBeenCalled();
    expect(received).toStrictEqual(expectedResponse);
  });
});
