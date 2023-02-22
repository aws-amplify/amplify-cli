import { getAllEnvs } from 'amplify-cli-core';

jest.mock('amplify-cli-core', () => ({
  getAllEnvs: jest.requireActual('amplify-cli-core').getAllEnvs,
  stateManager: {
    getLocalAWSInfo: jest.fn().mockReturnValue({ production: 'test', develop: 'test', staging: 'test' }),
  },
}));

describe('getAllEnvs', () => {
  it('should get all env names from team-provider-info.json', () => {
    const envNames = getAllEnvs();
    const expected = ['production', 'develop', 'staging'];
    expect(envNames).toStrictEqual(expected);
  });
});
