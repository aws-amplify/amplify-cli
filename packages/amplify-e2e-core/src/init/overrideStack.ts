// eslint-disable-next-line import/no-cycle
import { nspawn as spawn, getCLIPath } from '..';

export const amplifyOverrideRoot = (cwd: string, settings: { testingWithLatestCodebase?: boolean }): Promise<void> => {
  const args = ['override', 'project', '--debug'];

  return spawn(getCLIPath(settings.testingWithLatestCodebase), args, { cwd, stripColors: true })
    .wait('Do you want to edit override.ts file now?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export const amplifyOverrideAuth = (cwd: string): Promise<void> => {
  const args = ['override', 'auth', '--debug'];

  return spawn(getCLIPath(), args, { cwd, stripColors: true })
    .wait('Do you want to edit override.ts file now?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export const amplifyOverrideApi = (cwd: string): Promise<void> => {
  const args = ['override', 'api', '--debug'];
  const chain = spawn(getCLIPath(), args, { cwd, stripColors: true });
  chain.wait('Do you want to edit override.ts file now?').sendNo().sendEof();
  return chain.runAsync();
};

export const buildOverrides = (cwd: string): Promise<void> => {
  const args = ['build'];
  const chain = spawn(getCLIPath(), args, { cwd, stripColors: true });
  return chain.runAsync();
};
