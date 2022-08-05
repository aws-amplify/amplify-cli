import { $TSContext } from 'amplify-cli-core';
import { IEnvironmentMetadata } from '../environment-metadata-manager';

let initEnvMeta: (meta: Record<string, string>) => Promise<void>;
let getEnvMeta: (envName: string | undefined) => IEnvironmentMetadata;
let ensureEnvMeta: (context: $TSContext, envName: string | undefined) => Promise<IEnvironmentMetadata>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.isolateModules(async () => {
    ({ initEnvMeta, getEnvMeta, ensureEnvMeta } = await import('../environment-metadata-manager'));
  });
});

describe('initEnvMeta', () => {
  it('registers specified meta to be saved on exit', async () => {

  });
});

describe('getEnvMeta', () => {
  it('returns initialized meta for given environment', () => {

  });

  it('throws if specified env not initialized', () => {

  });
});

describe('ensureEnvMeta', () => {
  it('registers save on exit', async () => {

  });

  it('returns existing meta if already initialized', async () => {

  });

  it('initializes from amplify-meta if requested env is the current env', async () => {

  });

  it('initializes from calling amplify backend service if requested env is not the current env', async () => {

  });
});
