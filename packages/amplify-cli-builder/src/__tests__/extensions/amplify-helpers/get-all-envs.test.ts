import { getAllEnvs } from '../../../extensions/amplify-helpers/get-all-envs';
jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getTeamProviderInfo: jest.fn().mockReturnValue({ production: 'test', develop: 'test', staging: 'test' }),
  },
}));

describe('getAllEnvs', () => {
  it('should get all env names from team-provider-info.json', () => {
    const envNames = getAllEnvs();
    const expected = ['production', 'develop', 'staging'];
    expect(envNames).toStrictEqual(expected);
  });
});
