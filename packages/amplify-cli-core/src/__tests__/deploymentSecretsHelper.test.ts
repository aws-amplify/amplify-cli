import { DeploymentSecrets } from '..';
import * as helper from '../deploymentSecretsHelper';

describe('test deployment secrets helper', () => {
  const mockDeployment: DeploymentSecrets = {
    appSecrets: [
      {
        rootStackId: 'stackid1',
        environments: {
          dev: {
            auth: {
              tagseb306692: {
                hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"asd","client_secret":"asd"}]',
              },
            },
          },
        },
      },
      {
        rootStackId: 'stackid2',
        environments: {
          dev: {
            auth: {
              tagsc3b1bc32c3b1bc32: {
                hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"asd","client_secret":"asd"}]',
              },
            },
          },
        },
      },
    ],
  };
  it('remove but not found category', () => {
    expect(
      helper.removeFromDeploymentSecrets({
        currentDeploymentSecrets: mockDeployment,
        category: 'function',
        envName: 'asd',
        keyName: 'hostedUIProviderCreds',
        resource: 'functionxyz',
        rootStackId: 'stackid1',
      }).appSecrets.length,
    ).toEqual(2);
  });
  it('remove but not found env', () => {
    expect(
      helper.removeFromDeploymentSecrets({
        currentDeploymentSecrets: mockDeployment,
        category: 'auth',
        envName: 'asd',
        keyName: 'hostedUIProviderCreds',
        resource: 'functionxyz',
        rootStackId: 'stackid1',
      }).appSecrets.length,
    ).toEqual(2);
  });

  it('remove but not found resource', () => {
    expect(
      helper.removeFromDeploymentSecrets({
        currentDeploymentSecrets: mockDeployment,
        category: 'auth',
        envName: 'dev',
        keyName: 'hostedUIProviderCreds',
        resource: 'wrongresourcename',
        rootStackId: 'stackid1',
      }).appSecrets.length,
    ).toEqual(2);
  });
  it('remove and found', () => {
    const removedDeploymentSecrets = helper.removeFromDeploymentSecrets({
      currentDeploymentSecrets: mockDeployment,
      category: 'auth',
      envName: 'dev',
      keyName: 'hostedUIProviderCreds',
      resource: 'tagseb306692',
      rootStackId: 'stackid1',
    });
    expect(removedDeploymentSecrets.appSecrets.length).toEqual(1);
  });
});
