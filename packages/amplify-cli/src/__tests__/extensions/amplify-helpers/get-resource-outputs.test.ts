import { getResourceOutputs } from '../../../extensions/amplify-helpers/get-resource-outputs';
import { stateManager } from 'amplify-cli-core';

let metaDataMock = null;

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getMeta: jest.fn().mockImplementation(() => ({})),
  },
}));

describe('getResourceOutputs', () => {
  const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
  it('should return the correct object', () => {
    metaDataMock = stateManagerMock.getMeta();
    const received = getResourceOutputs(metaDataMock);
  });
  it('should return the correct object if amplifyMeta is null', () => {
    const received = getResourceOutputs(metaDataMock);
    expect(stateManagerMock.getMeta).toHaveBeenCalled();
  });
});
