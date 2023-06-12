import { getCLIPath, nspawn as spawn } from '..';

export const generateModels = async (cwd: string): Promise<void> => {
  await spawn(getCLIPath(), ['codegen', 'models'], { cwd, stripColors: true }).runAsync();
};
