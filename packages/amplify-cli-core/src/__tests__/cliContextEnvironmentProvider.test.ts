import { CLIEnvironmentProvider, CLIContextEnvironmentProvider } from '..';

describe('ContextCLIEnvironmentProvider tests', () => {
  test('returns env name from initialized context', () => {
    const context: any = {
      getEnvInfo: (): any => {
        return {
          envName: 'testenv',
        };
      },
    };

    const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);

    expect(envProvider.getCurrentEnvName()).toBe('testenv');
  });

  test('returns empty env name from when envInfo is undefined in context', () => {
    const context: any = {
      getEnvInfo: (): any => {
        return undefined;
      },
    };

    const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);

    expect(envProvider.getCurrentEnvName()).toBe('');
  });

  test('returns empty env name from when envInfo.envName is undefined in context', () => {
    const context: any = {
      getEnvInfo: (): any => {
        return {
          envName: undefined,
        };
      },
    };

    const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);

    expect(envProvider.getCurrentEnvName()).toBe('');
  });

  test('returns empty env name from when getEnvInfo throws', () => {
    const context: any = {
      getEnvInfo: (): any => {
        throw new Error();
      },
    };

    const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);

    expect(envProvider.getCurrentEnvName()).toBe('');
  });

  test('throws when undefined context passed in', () => {
    expect(() => {
      new CLIContextEnvironmentProvider(undefined as any);
    }).toThrowError('CLIContextEnvironmentProvider expects a context instance');
  });
});
