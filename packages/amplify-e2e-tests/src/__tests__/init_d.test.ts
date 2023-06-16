/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyStatus,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { isWindowsPlatform } from '@aws-amplify/amplify-cli-core';

describe('amplify init d', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init the project simulate checked in local-env-info with wrong path', async () => {
    await initJSProjectWithProfile(projRoot, {});

    // update <projRoot>/amplify/.config/local-env-info.json with nonexisting project path
    const localEnvPath = path.join(projRoot, 'amplify', '.config', 'local-env-info.json');
    expect(fs.existsSync(localEnvPath)).toBe(true);

    const localEnvData = fs.readJsonSync(localEnvPath);
    const originalPath = localEnvData.projectPath;

    if (isWindowsPlatform()) {
      // The project dir created using os.tmpdir() has shortened C:\\Users\\CIRCLE~1.PAC\\ segment
      // but projectPath comes as C:\\Users\\circleci.PACKER-633B1A5A\\ for example
      // which is fine but makes comparison harder
      expect(path.isAbsolute(localEnvData.projectPath)).toBe(true);
      expect(fs.statSync(localEnvData.projectPath)).toEqual(fs.statSync(projRoot));
    } else {
      expect(localEnvData.projectPath).toEqual(fs.realpathSync(projRoot));
    }

    localEnvData.projectPath = path.join('foo', 'bar');

    fs.writeFileSync(localEnvPath, JSON.stringify(localEnvData, null, 2));

    // execute amplify status, which involves feature flags initialization, it must succeed
    await amplifyStatus(projRoot, 'Current Environment');

    // write back original path to make delete succeed in cleanup
    localEnvData.projectPath = originalPath;

    fs.writeFileSync(localEnvPath, JSON.stringify(localEnvData, null, 2));
  });
});
