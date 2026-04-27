import { createNewProjectDir, deleteProjectDir, nspawn as spawn, getCLIPath } from '@aws-amplify/amplify-e2e-core';

describe('amplify init gen1 restriction', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('gen1-restrict');
  });

  afterEach(() => {
    deleteProjectDir(projectRoot);
  });

  it('should block amplify init --quickstart for new customers', async () => {
    await expect(
      spawn(getCLIPath(), ['init', '--quickstart'], {
        cwd: projectRoot,
        stripColors: true,
        disableCIDetection: true,
      })
        .wait('maintenance mode')
        .runAsync(),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('should block amplify init --yes for new customers', async () => {
    await expect(
      spawn(getCLIPath(), ['init', '--yes'], {
        cwd: projectRoot,
        stripColors: true,
        disableCIDetection: true,
      })
        .wait('maintenance mode')
        .runAsync(),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });
});
