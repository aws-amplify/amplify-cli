// import * as consola from 'consola';

export type AppSyncSimulatorLogger = {
  log: (...msgs: string[]) => {};
  info: (...msgs: string[]) => {};
  warn: (...msgs: string[]) => {};
  debug: (...msgs: string[]) => {};
  error: (...msgs: string[]) => {};
};

export const logger = {};
