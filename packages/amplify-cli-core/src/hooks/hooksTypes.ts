export type HooksExtensions = Record<string, { runtime: string; runtime_windows?: string }>;

export type HooksConfig = {
  extensions?: HooksExtensions;
  ignore?: string[];
};

export type HooksFileMeta = {
  baseName: string;
  extension?: string;
  filePath?: string;
  fileName: string;
};

export type EventPrefix = 'pre' | 'post';

export type HooksEvent = {
  command: string;
  subCommand?: string;
  argv: string[];
  eventPrefix?: EventPrefix;
  forcePush: boolean;
};

export type DataParameter = {
  amplify: {
    version?: string;
    environment?: string;
    command?: string;
    subCommand?: string;
    argv?: string[];
  };
};

export type ErrorParameter = { message: string; stack: string };

export type HooksVerb =
  | 'add'
  | 'update'
  | 'remove'
  | 'push'
  | 'pull'
  | 'publish'
  | 'delete'
  | 'checkout'
  | 'list'
  | 'get'
  | 'mock'
  | 'build'
  | 'status'
  | 'import'
  | 'gqlcompile'
  | 'addgraphqldatasource'
  | 'statements'
  | 'types';

export type HooksNoun =
  | 'notifications'
  | 'analytics'
  | 'api'
  | 'auth'
  | 'function'
  | 'hosting'
  | 'interactions'
  | 'predictions'
  | 'storage'
  | 'xr'
  | 'codegen'
  | 'env';
