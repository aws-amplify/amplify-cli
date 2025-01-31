import * as fs from 'fs-extra';
import execa from 'execa';

import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getNpxPath,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import * as babel from '@babel/core';
import * as babelTransformEsmToCjs from '@babel/plugin-transform-modules-commonjs';
import Module from 'module';

describe('JS frontend config tests', () => {
  let projRoot: string;
  let appRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('aws-exports-test');
    appRoot = await createReactApp(projRoot, 'reactapp');
  });

  afterEach(async () => {
    // extra delete in case test fails, delete is noop if project was already deleted
    await deleteProject(appRoot);
    deleteProjectDir(projRoot);
  });

  test('both aws-exports.js & amplifyconfiguration.json is generated', async () => {
    // amplify init, this will generate aws-exports in the project
    await initJSProjectWithProfile(appRoot, { name: 'reactapp' });

    // check if amplify init generated project files
    expect(fs.existsSync(`${appRoot}/src/aws-exports.js`)).toBeTruthy();
    expect(fs.existsSync(`${appRoot}/src/amplifyconfiguration.json`)).toBeTruthy();

    const initialAwsExportsModule = readAwsExports(appRoot, `${appRoot}/src/aws-exports.js`);
    const initialAmplifyConfiguration = fs.readJSONSync(`${appRoot}/src/amplifyconfiguration.json`);

    // contents should match
    expect(initialAwsExportsModule).toMatchObject(initialAmplifyConfiguration);

    // should update both aws-exports.js & amplifyconfiguration.json
    // add a category
    await addAuthWithDefault(appRoot);
    await amplifyPushAuth(appRoot);

    // when aws-exports updates, both files should still exist
    const awsExportsModule = readAwsExports(appRoot, `${appRoot}/src/aws-exports.js`);
    const amplifyConfiguration = fs.readJSONSync(`${appRoot}/src/amplifyconfiguration.json`);

    // config should have updated
    expect(amplifyConfiguration.aws_user_pools_id).toBeDefined();

    // contents should match
    expect(amplifyConfiguration).toMatchObject(awsExportsModule);
    expect(amplifyConfiguration).not.toStrictEqual(initialAmplifyConfiguration);

    // both aws-exports.js & amplifyconfiguration.json should be removed on delete
    await deleteProject(appRoot);

    // when amplify app gets deleted, all config should be removed
    expect(fs.existsSync(`${appRoot}/src/aws-exports.js`)).toBeFalsy();
    expect(fs.existsSync(`${appRoot}/src/amplifyconfiguration.json`)).toBeFalsy();
  });
});

// returns path to react project directory
async function createReactApp(cwd: string, projectName: string) {
  const projectRoot = `${cwd}/${projectName}`;

  execa.sync(getNpxPath(), ['create-react-app', '--scripts-version', '5.0.1', projectName, '--use-npm'], { cwd, encoding: 'utf-8' });

  return projectRoot;
}

/**
 * Reads and transpiles aws exports. Jest doesn't like ES6 modules.
 */
function readAwsExports(projectPath: string, targetFilePath: string) {
  const fileContents = fs.readFileSync(targetFilePath, 'utf-8');
  // transpile the file contents to CommonJS
  const { code } = babel.transformSync(fileContents, {
    plugins: [babelTransformEsmToCjs],
    configFile: false,
    babelrc: false,
  });
  const mod = new Module('test_module');
  // @ts-ignore
  mod._compile(code, 'aws-exports.js');
  // add paths to the module to account for node_module imports in aws-exports.js (should there be any)
  mod.paths = [projectPath];
  // the transpiled result will contain `exports.default`
  return mod.exports?.default || mod.exports;
}
