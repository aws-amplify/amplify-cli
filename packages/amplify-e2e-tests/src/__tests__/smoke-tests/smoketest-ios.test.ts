import {
  addApi,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initIosProjectWithXcode,
  nspawn as spawn,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Smoke Test - iOS', () => {
  if (process.platform == 'darwin') {
    let projRoot: string;
    const exampleIOSAppPath = path.resolve(__dirname, '..', '..', '..', 'resources', 'example-ios-app');
    beforeEach(async () => {
      projRoot = await createNewProjectDir('ios-app');
    });

    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });

    it('Creates Amplify iOS App', async () => {
      await fs.cp(exampleIOSAppPath, projRoot, {
        recursive: true,
      });

      await initIosProjectWithXcode(projRoot);
      await rubyBundleInstall(projRoot);
      await buildAndTestExampleIosApp(projRoot);
      // await addApi(projRoot);
    });
  } else {
    it('dummy test', () => {});
  }
});

function rubyBundleInstall(cwd: string) {
  return spawn('bundle', ['install'], {
    cwd,
  })
    .wait('Bundle complete')
    .runAsync();
}

function buildAndTestExampleIosApp(cwd: string) {
  return spawn('bundle', ['exec', 'fastlane', 'scan', '--device', 'iPhone 14 Pro', '--deployment_target_version', '16.4'], {
    cwd,
  })
    .wait(/Test.*Succeeded/)
    .runAsync();
}
