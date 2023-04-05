import { stateManager } from '@aws-amplify/amplify-cli-core';
import { legacyAuthConfigHasTriggers } from '../../utils/legacyAuthConfigHasTriggers';

jest.mock('@aws-amplify/amplify-cli-core');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
describe('legacyAuthConfigHasTriggers', () => {
  it('returns false if params are undefined', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce(undefined);
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if params are null', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce(null);
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if params are not an object', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce('garbage');
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if "triggers" is not a key in the object', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce({ unknownKey: 'someValue' });
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if "triggers" value is not a string', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce({ triggers: 23 });
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if the "triggers" value is invalid JSON', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce({ triggers: 'not a json string' });
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if the "triggers" value parses to something that is not an object', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce({ triggers: JSON.stringify('valid json') });
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns false if the "triggers" object is empty', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce({ triggers: JSON.stringify({}) });
    expect(legacyAuthConfigHasTriggers('testName')).toBe(false);
  });

  it('returns true if the "triggers" object has at least one key', () => {
    stateManagerMock.getResourceParametersJson.mockReturnValueOnce({ triggers: JSON.stringify({ testTrigger: ['config'] }) });
    expect(legacyAuthConfigHasTriggers('testName')).toBe(true);
  });
});
