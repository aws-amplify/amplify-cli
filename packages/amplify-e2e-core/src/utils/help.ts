import { getCLIPath, nspawn as spawn } from '..';

export const statusWithHelp = async (cwd: string, expectedContents: Array<string>): Promise<void> => {
  const chain = spawn(getCLIPath(), ['status', '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedContents) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};

export const statusForCategoryWithHelp = async (cwd: string, category: string, expectedContents: Array<string>): Promise<void> => {
  const chain = spawn(getCLIPath(), ['status', category, '-h'], { cwd, stripColors: true });
  for (const expectedLine of expectedContents) {
    chain.wait(expectedLine);
  }
  await chain.runAsync();
};
