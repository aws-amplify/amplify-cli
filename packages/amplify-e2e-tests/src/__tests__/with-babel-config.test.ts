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
  // eslint-disable-next-line spellcheck/spell-checker
  const projName = 'withbabelconfig';
  const envName = 'dev';

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
  });

  afterAll(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('should init a project', async () => {
    await initJSProjectWithProfile(projectRoot, { name: projName, envName });
  });

  test('it should read aws-exports.js', () => {
    spawn(getCLIPath(), ['env', 'checkout', envName], { cwd: projectRoot, stripColors: true });
  });
});
