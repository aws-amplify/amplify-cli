import { secretValueValidator } from '../../../../provider-utils/awscloudformation/service-walkthroughs/secretValuesWalkthrough';

describe('Check not valid secret values', () => {
  it('Empty value', () => {
    expect(secretValueValidator('')).toEqual('Secret value must be between 1 and 2048 characters long');
  });
  it('Value over 2048 characters', () => {
    expect(secretValueValidator('a'.repeat(2049))).toEqual('Secret value must be between 1 and 2048 characters long');
  });
});
