/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import { createNewProjectDir, deleteProjectDir, getNpxPath, nspawn as spawn, getCLIPath } from '@aws-amplify/amplify-e2e-core';

describe('amplify init - Gen 1 new-customer restriction', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('gen1-restriction');
  });

  afterEach(() => {
    deleteProjectDir(projRoot);
  });

  it('should block amplify init --quickstart for new Gen 1 customers', async () => {
    await expect(
      spawn(getCLIPath(), ['init', '--quickstart'], { cwd: projRoot, stripColors: true }).runAsync(),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });
});
