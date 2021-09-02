import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import {
  nspawn as spawn,
  getCLIPath,
  addFunction,
  initJSProjectWithProfile,
  deleteProject,
  getBackendAmplifyMeta,
  addAuthWithDefault,
  createNewProjectDir,
  deleteProjectDir,
} from 'amplify-e2e-core';

describe('nodejs version migration tests', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('node-function');
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('init a project and add simple function and migrate node version', async () => {
    await initJSProjectWithProfile(projectRoot, {});

    const random = Math.floor(Math.random() * 10000);
    const functionName = `nodefunction${random}`;

    await addAuthWithDefault(projectRoot);
    await addFunction(projectRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs');

    const meta = getBackendAmplifyMeta(projectRoot);

    // Write back project version to 3.0
    const projectConfigFileName = path.join(projectRoot, 'amplify', '.config', 'project-config.json');
    let projectConfigContent = fs.readFileSync(projectConfigFileName).toString();

    projectConfigContent = projectConfigContent.replace('3.1', '3.0');

    fs.writeFileSync(projectConfigFileName, projectConfigContent, 'utf-8');

    // Write back the nodejs version to 'node10.x' to test migration
    const authResourceName = Object.keys(meta.auth)[0];
    const authStackFileName = path.join(
      projectRoot,
      'amplify',
      'backend',
      'auth',
      authResourceName,
      `${authResourceName}-cloudformation-template.yml`,
    );
    let authStackContent = fs.readFileSync(authStackFileName).toString();

    authStackContent = authStackContent.replace('nodejs12.x', 'nodejs10.x');

    fs.writeFileSync(authStackFileName, authStackContent, 'utf-8');

    const functionResourceName = Object.keys(meta.function)[0];
    const functionStackFileName = path.join(
      projectRoot,
      'amplify',
      'backend',
      'function',
      functionResourceName,
      `${functionResourceName}-cloudformation-template.json`,
    );
    let functionStackContent = fs.readFileSync(functionStackFileName).toString();

    functionStackContent = functionStackContent.replace('nodejs14.x', 'nodejs10.x');

    fs.writeFileSync(functionStackFileName, functionStackContent, 'utf-8');

    // Executing amplify push triggers the migration
    await amplifyNodeMigrationAndPush(projectRoot);

    projectConfigContent = fs.readFileSync(projectConfigFileName).toString();
    authStackContent = fs.readFileSync(authStackFileName).toString();
    functionStackContent = fs.readFileSync(functionStackFileName).toString();

    expect(projectConfigContent.indexOf('3.1')).toBeGreaterThan(0);
    expect(authStackContent.indexOf('nodejs12.x')).toBeGreaterThan(0);
    expect(functionStackContent.indexOf('nodejs12.x')).toBeGreaterThan(0);
  });

  function amplifyNodeMigrationAndPush(cwd: string) {
    return new Promise((resolve, reject) => {
      spawn(getCLIPath(), ['push'], { cwd, stripColors: true, disableCIDetection: true })
        .wait('Confirm to update the Node.js runtime version to nodejs')
        .sendConfirmYes()
        .wait('Node.js runtime version successfully updated')
        .wait('Are you sure you want to continue?')
        .sendLine('y')
        .wait(/.*/)
        .run((err: Error) => {
          if (!err) {
            resolve(undefined);
          } else {
            reject(err);
          }
        });
    });
  }
});
