import { toolkitExtensions } from 'amplify-cli-core';
const { getAllEnvs } = toolkitExtensions;

jest.mock('amplify-cli-core', () => ({
  toolkitExtensions: jest.requireActual('amplify-cli-core').toolkitExtensions,
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
