import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import {
  initJSProjectWithProfile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  nspawn as spawn,
  getCLIPath,
} from '@aws-amplify/amplify-e2e-core';

describe('project with babel config', () => {
  let projectRoot: string;
  let packageJsonPath: string;
  let babelConfigPath: string;
  const projName = 'withBabelConfig';
  const envName = 'devtest';

  beforeAll(async () => {
    projectRoot = await createNewProjectDir(projName);
    packageJsonPath = path.join(projectRoot, 'package.json');
    babelConfigPath = path.join(projectRoot, 'babel.config.json');

    // write package.json
    const packageJson = {
      name: projName,
      version: '0.1.0',
      private: true,
      devDependencies: {
        '@babel/core': '^7.19.1',
      },
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // write babel config
    const babelConfig = {
      presets: ['es2015'],
    };
    fs.writeFileSync(babelConfigPath, JSON.stringify(babelConfig, null, 2));

    // install babel dependencies
    spawnSync('npm', ['install'], { cwd: projectRoot });

    // init project
    await initJSProjectWithProfile(projectRoot, { name: projName, envName });
  });

  afterAll(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  /**
   * This test is to ensure the CLI is able to read aws-exports.js when a babel config file is present
   * @see {module:@aws-amplify/amplify-frontend-javascript/lib/frontend-config-creator.js:getCurrentAWSExports}
   */
  it('should be able to checkout env (reads aws-exports)', async () => {
    expect(() => spawn(getCLIPath(), ['env', 'checkout', envName], { cwd: projectRoot, stripColors: true })).not.toThrow();
  });
});
