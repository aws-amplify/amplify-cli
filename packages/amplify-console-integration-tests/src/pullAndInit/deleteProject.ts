import * as util from '../util';
import { nspawn as spawn } from '@aws-amplify/amplify-e2e-core';

export const headlessDelete = (projectRootDirPath: string): Promise<void> => {
  return spawn(util.getCLIPath(), ['delete'], { cwd: projectRootDirPath, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait('Project deleted locally.')
    .runAsync();
};
