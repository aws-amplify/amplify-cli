import * as path from 'path';
import * as fs from 'fs-extra';
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
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';

describe('nodejs version migration tests', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('node-function');
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it.only('init a project and add simple function and migrate node version', async () => {
    console.log('here 1');
    await initJSProjectWithProfile(projectRoot, {});

    console.log('here 2');
    const functionName = `nodefunction${generateRandomShortId()}`;

    console.log('here 3');
    await addAuthWithDefault(projectRoot);

    console.log('here 4');
    await addFunction(projectRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs');

    console.log('here 5');
    const meta = getBackendAmplifyMeta(projectRoot);

    // Write back project version to 3.0

    console.log('here 6');
    const projectConfigFileName = path.join(projectRoot, 'amplify', '.config', 'project-config.json');

    console.log('here 7');
    let projectConfigContent = fs.readFileSync(projectConfigFileName).toString();

    console.log('here 8');
    projectConfigContent = projectConfigContent.replace('3.1', '3.0');

    console.log('here 9');
    fs.writeFileSync(projectConfigFileName, projectConfigContent, 'utf-8');

    // Write back the nodejs version to 'node10.x' to test migration

    console.log('here 10');
    const authResourceName = Object.keys(meta.auth)[0];

    console.log('here 11');
    const authStackFileName = path.join(
      projectRoot,
      'amplify',
      'backend',
      'auth',
      authResourceName,
      'build',
      `${authResourceName}-cloudformation-template.json`,
    );

    console.log('here 12');
    let authStackContent = fs.readFileSync(authStackFileName).toString();

    console.log('here 13');
    authStackContent = authStackContent.replace('nodejs16.x', 'nodejs10.x');

    console.log('here 14');
    fs.writeFileSync(authStackFileName, authStackContent, 'utf-8');

    console.log('here 15');
    const functionResourceName = Object.keys(meta.function)[0];

    console.log('here 16');
    const functionStackFileName = path.join(
      projectRoot,
      'amplify',
      'backend',
      'function',
      functionResourceName,
      `${functionResourceName}-cloudformation-template.json`,
    );

    console.log('here 17');
    let functionStackContent = fs.readFileSync(functionStackFileName).toString();

    console.log('here 18');
    functionStackContent = functionStackContent.replace(/nodejs\d{1,2}\.x/, 'nodejs10.x');

    console.log('here 19');
    fs.writeFileSync(functionStackFileName, functionStackContent, 'utf-8');

    // Executing amplify push triggers the migration
    console.log('here 20');
    await amplifyNodeMigrationAndPush(projectRoot);

    console.log('here 21');
    projectConfigContent = fs.readFileSync(projectConfigFileName).toString();
    authStackContent = fs.readFileSync(authStackFileName).toString();
    functionStackContent = fs.readFileSync(functionStackFileName).toString();

    expect(projectConfigContent.indexOf('3.1')).toBeGreaterThan(0);
    expect(authStackContent.indexOf('nodejs16.x')).toBeGreaterThan(0);
    expect(functionStackContent.indexOf('nodejs16.x')).toBeGreaterThan(0);
  });

  const amplifyNodeMigrationAndPush = async (cwd: string): Promise<void> => {
    return spawn(getCLIPath(), ['push'], { cwd, stripColors: true, disableCIDetection: true })
      .wait('Confirm to update the Node.js runtime version to nodejs')
      .sendConfirmYes()
      .wait('Node.js runtime version successfully updated')
      .wait('Are you sure you want to continue?')
      .sendYes()
      .wait(/.*/)
      .runAsync();
  };
});
