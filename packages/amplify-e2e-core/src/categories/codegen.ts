import { getCLIPath, nspawn as spawn } from '..';

export const generateModels = (
  cwd: string,
  settings?: {
    expectXcode?: boolean;
  },
): Promise<void> => {
  const chain = spawn(getCLIPath(), ['codegen', 'models'], { cwd, stripColors: true });
  if (settings?.expectXcode) {
    chain.wait('Updating Xcode project').wait('Successfully added models').wait('Amplify setup completed successfully.');
  }
  return chain.runAsync();
};
