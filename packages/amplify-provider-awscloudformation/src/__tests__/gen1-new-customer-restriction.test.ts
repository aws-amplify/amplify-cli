import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { AmplifyClient, ListAppsCommand, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';
import { isExistingGen1Customer, enforceGen1NewCustomerRestriction } from '../gen1-new-customer-restriction';

const mockAmplifyClient = mockClient(AmplifyClient);

const GEN1_DEPRECATION_MESSAGE =
  'AWS Amplify Gen 1 has entered maintenance mode and will no longer accept new customers. Gen 1 will reach end of life on May 1, 2027. Start a new app with Amplify Gen 2: https://docs.amplify.aws/';

describe('isExistingGen1Customer', () => {
  beforeEach(() => {
    mockAmplifyClient.reset();
  });

  it('returns true when an app has backend environments', async () => {
    mockAmplifyClient.on(ListAppsCommand).resolves({
      apps: [{ appId: 'app-1', name: 'my-app' }] as any,
    });
    mockAmplifyClient.on(ListBackendEnvironmentsCommand).resolves({
      backendEnvironments: [{ environmentName: 'dev', stackName: 'stack-1' }] as any,
    });

    const result = await isExistingGen1Customer(mockAmplifyClient as unknown as AmplifyClient);
    expect(result).toBe(true);
  });

  it('returns false when no apps exist', async () => {
    mockAmplifyClient.on(ListAppsCommand).resolves({ apps: [] });

    const result = await isExistingGen1Customer(mockAmplifyClient as unknown as AmplifyClient);
    expect(result).toBe(false);
  });

  it('returns false when apps exist but none have backend environments', async () => {
    mockAmplifyClient.on(ListAppsCommand).resolves({
      apps: [
        { appId: 'app-1', name: 'app-one' },
        { appId: 'app-2', name: 'app-two' },
      ] as any,
    });
    mockAmplifyClient.on(ListBackendEnvironmentsCommand).resolves({ backendEnvironments: [] });

    const result = await isExistingGen1Customer(mockAmplifyClient as unknown as AmplifyClient);
    expect(result).toBe(false);
  });

  it('handles pagination correctly', async () => {
    mockAmplifyClient
      .on(ListAppsCommand)
      .resolvesOnce({ apps: [{ appId: 'app-1', name: 'app-one' }] as any, nextToken: 'page-2-token' })
      .resolvesOnce({ apps: [{ appId: 'app-2', name: 'app-two' }] as any });

    mockAmplifyClient.on(ListBackendEnvironmentsCommand, { appId: 'app-1' }).resolves({ backendEnvironments: [] });
    mockAmplifyClient
      .on(ListBackendEnvironmentsCommand, { appId: 'app-2' })
      .resolves({ backendEnvironments: [{ environmentName: 'dev', stackName: 'stack-2' }] as any });

    const result = await isExistingGen1Customer(mockAmplifyClient as unknown as AmplifyClient);
    expect(result).toBe(true);
    expect(mockAmplifyClient).toHaveReceivedCommandTimes(ListAppsCommand, 2);
  });

  it('short-circuits on first match', async () => {
    mockAmplifyClient.on(ListAppsCommand).resolves({
      apps: [
        { appId: 'app-1', name: 'app-one' },
        { appId: 'app-2', name: 'app-two' },
      ] as any,
    });
    mockAmplifyClient
      .on(ListBackendEnvironmentsCommand, { appId: 'app-1' })
      .resolves({ backendEnvironments: [{ environmentName: 'dev', stackName: 'stack-1' }] as any });

    const result = await isExistingGen1Customer(mockAmplifyClient as unknown as AmplifyClient);
    expect(result).toBe(true);
    expect(mockAmplifyClient).toHaveReceivedCommandTimes(ListBackendEnvironmentsCommand, 1);
  });

  it('returns true (fail-open) when API throws an error', async () => {
    mockAmplifyClient.on(ListAppsCommand).rejects(new Error('Access Denied'));
    const result = await isExistingGen1Customer(mockAmplifyClient as unknown as AmplifyClient);
    expect(result).toBe(true);
  });
});

describe('enforceGen1NewCustomerRestriction', () => {
  beforeEach(() => {
    mockAmplifyClient.reset();
  });

  it('allows existing Gen 1 customer', async () => {
    mockAmplifyClient.on(ListAppsCommand).resolves({ apps: [{ appId: 'app-1', name: 'my-app' }] as any });
    mockAmplifyClient.on(ListBackendEnvironmentsCommand).resolves({
      backendEnvironments: [{ environmentName: 'dev', stackName: 'stack-1' }] as any,
    });

    await expect(enforceGen1NewCustomerRestriction(mockAmplifyClient as unknown as AmplifyClient)).resolves.toBeUndefined();
  });

  it('blocks non-existing customer with correct error', async () => {
    mockAmplifyClient.on(ListAppsCommand).resolves({ apps: [] });

    await expect(enforceGen1NewCustomerRestriction(mockAmplifyClient as unknown as AmplifyClient)).rejects.toThrow(
      GEN1_DEPRECATION_MESSAGE,
    );

    try {
      await enforceGen1NewCustomerRestriction(mockAmplifyClient as unknown as AmplifyClient);
    } catch (e) {
      expect(e.name).toBe('ProjectInitError');
    }
  });
});
