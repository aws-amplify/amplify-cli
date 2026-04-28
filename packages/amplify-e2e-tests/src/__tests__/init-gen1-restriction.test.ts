/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import { createNewProjectDir, deleteProjectDir, nspawn as spawn, getCLIPath } from '@aws-amplify/amplify-e2e-core';

describe('amplify init - Gen 1 new-customer restriction', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('gen1-restriction');
  });

  afterEach(() => {
    deleteProjectDir(projRoot);
  });

  it('should block amplify init --quickstart with deprecation message', async () => {
    await expect(
      spawn(getCLIPath(), ['init', '--quickstart'], { cwd: projRoot, stripColors: true })
        .wait('AWS Amplify Gen 1 has entered maintenance mode')
        .runAsync(),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });
});
