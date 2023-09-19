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
import {} from '@aws-amplify/amplify-e2e-core';

describe('JS frontend config tests', () => {
  let projRoot: string;
  let appRoot: string;

  beforeAll(async () => {
    projRoot = await createNewProjectDir('aws-exports-test');
  });

  afterAll(async () => {
    deleteProjectDir(projRoot);
  });

  test('both aws-exports.js & amplifyconfiguration.json is generated on init', async () => {
    // init react app using create-react-app
    appRoot = await createReactApp(projRoot, 'reactapp');

    // amplify init, this will generate aws-exports in the project
    await initJSProjectWithProfile(appRoot, { name: 'reactapp' });

    // check if amplify init generated project files
    expect(fs.existsSync(`${appRoot}/src/aws-exports.js`)).toBeTruthy();
    expect(fs.existsSync(`${appRoot}/src/amplifyconfiguration.json`)).toBeTruthy();

    const amplifyconfiguration = fs.readJSONSync(`${appRoot}/src/amplifyconfiguration.json`);
    const awsExportsModule = await import(`${appRoot}/src/amplifyconfiguration.json`);

    // contents should match
    expect(amplifyconfiguration).toMatchObject(awsExportsModule.default);
  });

  test('should update both both aws-exports.js & amplifyconfiguration.json', async () => {
    // add an category
    await addAuthWithDefault(appRoot);
    await amplifyPushAuth(appRoot);

    // when aws-exports updates, both files should still exist
    const amplifyconfiguration = fs.readJSONSync(`${appRoot}/src/amplifyconfiguration.json`);
    const awsExportsModule = await import(`${appRoot}/src/amplifyconfiguration.json`);

    // contents should match
    expect(amplifyconfiguration.aws_user_pools_id).toBeDefined();
    expect(amplifyconfiguration).toMatchObject(awsExportsModule.default);
  });

  test('both aws-exports.js & amplifyconfiguraion.json should be removed on delete', async () => {
    await deleteProject(projRoot);

    // when amplify app gets deleted, all config should be removed
    expect(fs.existsSync(`${appRoot}/src/aws-exports.js`)).toBeFalsy();
    expect(fs.existsSync(`${appRoot}/src/amplifyconfiguration.json`)).toBeFalsy();
  });
});

// returns path to react project directory
async function createReactApp(cwd: string, projectName: string) {
  const projectRoot = `${cwd}/${projectName}`;

  execa.sync(getNpxPath(), ['create-react-app', projectName, '--use-npm'], { cwd, encoding: 'utf-8' });

  return projectRoot;
}
