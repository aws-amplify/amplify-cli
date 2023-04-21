import { HookExtensions, HooksNoun, HooksVerb } from './hooksTypes';

export const hookFileSeparator = '-';

export const supportedEvents: Record<HooksVerb, HooksNoun[]> = {
  add: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'codegen', 'env'],
  update: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'env'],
  remove: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'env'],
  push: ['analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'storage'],
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

export const skipHooksFilePath = '/opt/amazon';
