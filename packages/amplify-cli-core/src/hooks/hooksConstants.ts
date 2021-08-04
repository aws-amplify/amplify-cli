import { join } from 'path';
import { homedir } from 'os';
import { HooksExtensions, HooksNoun, HooksVerb } from './hooksTypes';

export const hooksFileSeperator = '-';

export const suppportedEvents: Record<HooksVerb, Set<HooksNoun>> = {
  add: new Set([
    'notifications',
    'analytics',
    'api',
    'auth',
    'function',
    'hosting',
    'interactions',
    'predictions',
    'storage',
    'xr',
    'codegen',
    'env',
  ]),
  update: new Set([
    'notifications',
    'analytics',
    'api',
    'auth',
    'function',
    'hosting',
    'interactions',
    'predictions',
    'storage',
    'xr',
    'env',
  ]),
  remove: new Set([
    'notifications',
    'analytics',
    'api',
    'auth',
    'function',
    'hosting',
    'interactions',
    'predictions',
    'storage',
    'xr',
    'env',
  ]),
  push: new Set(['analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'storage', 'xr']),
  pull: new Set(['env']),
  publish: new Set([]),
  delete: new Set([]),
  checkout: new Set(['env']),
  list: new Set(['env']),
  get: new Set(['env']),
  mock: new Set(['api', 'storage', 'function']),
  build: new Set(['function']),
  status: new Set(['notifications']),
  import: new Set(['auth', 'storage', 'env']),
  gqlcompile: new Set(['api']),
  addgraphqldatasource: new Set(['api']),
  statements: new Set(['codegen']),
  types: new Set(['codegen']),
};

export const supportedEnvEvents: Set<HooksVerb> = new Set(['add', 'update', 'remove', 'pull', 'checkout', 'list', 'get', 'import']);

export const defaultSupportedExt: HooksExtensions = { js: { runtime: 'node' }, sh: { runtime: 'bash' } };

export const skipHooksFileName: string = 'AMIPLIFY-HOOKS-SKIP';
export const skipHooksFilePath: string = join(homedir(), 'opt', 'amazon');
