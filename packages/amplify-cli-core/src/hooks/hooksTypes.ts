export type HooksExtension = {
  [key: string]: {
    runtime?: string;
    windows?: { runtime?: string };
  };
};

export type HooksConfig = {
  extension?: HooksExtension;
  ignore?: string[];
};

export type FileObj = {
  baseName?: string;
  extension?: string;
  filePath?: string;
  fileName?: string;
};

export type EventPrefix = 'pre' | 'post';

export type HooksEvent = {
  command?: string;
  subCommand?: string;
  argv?: string[];
  seperator: '-' | string;
  eventPrefix?: EventPrefix;
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
