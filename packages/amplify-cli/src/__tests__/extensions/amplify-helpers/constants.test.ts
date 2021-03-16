import { amplifyCLIConstants } from '../../../extensions/amplify-helpers/constants';

describe('constants', () => {
  it('should freeze values', () => {
    expect(amplifyCLIConstants.AmplifyCLIDirName).toBe('amplify');
    expect(() => {
      (amplifyCLIConstants as any).AmplifyCLIDirName = 'test';
    }).toThrow(new TypeError("Cannot assign to read only property 'AmplifyCLIDirName' of object '#<Object>'"));
    expect(amplifyCLIConstants.AmplifyCLIDirName).toBe('amplify');
  });
});
