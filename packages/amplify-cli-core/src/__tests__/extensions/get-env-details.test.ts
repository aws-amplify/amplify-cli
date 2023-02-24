import { toolkitExtensions, stateManager } from '../..';
const { getEnvDetails } = toolkitExtensions;
jest
  .spyOn(stateManager, 'getTeamProviderInfo')
  .mockReturnValue({ production: 'test_production', develop: 'test_develop', staging: 'test_staging' });

describe('getEnvDetails', () => {
  it('should get the details for each env', () => {
    const envDetails = getEnvDetails();
    expect(envDetails['production']).toEqual('test_production');
    expect(envDetails['develop']).toEqual('test_develop');
    expect(envDetails['staging']).toEqual('test_staging');
  });
});
