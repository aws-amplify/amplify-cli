import { createNewProjectDir, deleteProject, deleteProjectDir } from '@aws-amplify/amplify-e2e-core';

describe('Smoke Test - iOS', () => {
  if (process.platform == 'darwin') {
    let projRoot: string;
    beforeEach(async () => {
      projRoot = await createNewProjectDir('ios-app');
    });

    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });

    it('Creates Amplify iOS App', () => {

    });
  } else {
    it('dummy test', () => {});
  }
});
