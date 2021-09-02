import { join } from 'path';
import { homedir } from 'os';
import { HookExtensions, HooksNoun, HooksVerb } from './hooksTypes';

export const hookFileSeperator = '-';

export const suppportedEvents: Record<HooksVerb, HooksNoun[]> = {
  add: [
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
  ],
  update: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'xr', 'env'],
  remove: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'xr', 'env'],
  push: ['analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'storage', 'xr'],
  pull: ['env'],
  publish: [],
  delete: [],
  checkout: ['env'],
  list: ['env'],
  get: ['env'],
  mock: ['api', 'storage', 'function'],
  build: ['function'],
  status: ['notifications'],
  import: ['auth', 'storage', 'env'],
  gqlcompile: ['api'],
  addgraphqldatasource: ['api'],
  statements: ['codegen'],
  types: ['codegen'],
};

export const supportedEnvEvents: HooksVerb[] = ['add', 'update', 'remove', 'pull', 'checkout', 'list', 'get', 'import'];

export const defaultSupportedExt: HookExtensions = { js: { runtime: 'node' }, sh: { runtime: 'bash' } };

export const skipHooksFilePath: string = '/opt/amazon';
