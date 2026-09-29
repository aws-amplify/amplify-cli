import { getCLIPath, nspawn as spawn } from '..';

export const statusWithHelp = async (cwd: string): Promise<void> => {
  const expectedLines = ['USAGE', 'amplify status [-v | --verbose]'];
  const chain = spawn(getCLIPath(), ['status', '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedLines) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};

export const statusForCategoryWithHelp = async (cwd: string, category: string): Promise<void> => {
  const expectedLines = ['USAGE', `amplify ${category} status`];
  const chain = spawn(getCLIPath(), ['status', category, '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedLines) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};

export const pushWithHelp = async (cwd: string): Promise<void> => {
  const expectedLines = ['USAGE', /amplify push*/];
  const chain = spawn(getCLIPath(), ['push', '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedLines) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};

export const initWithHelp = async (cwd: string): Promise<void> => {
  const expectedLines = ['USAGE', /amplify init*/];
  const chain = spawn(getCLIPath(), ['init', '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedLines) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};

export const pullWithHelp = async (cwd: string): Promise<void> => {
  const expectedLines = ['USAGE', /amplify pull*/];
  const chain = spawn(getCLIPath(), ['pull', '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedLines) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};

export const envWithHelp = async (cwd: string): Promise<void> => {
  const expectedLines = ['USAGE', 'amplify env <subcommand>'];
  const chain = spawn(getCLIPath(), ['env', '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedLines) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};
