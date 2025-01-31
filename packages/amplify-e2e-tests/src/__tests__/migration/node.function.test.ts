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

  it('init a project and add simple function and migrate node version', async () => {
    await initJSProjectWithProfile(projectRoot, {});

    const functionName = `nodefunction${generateRandomShortId()}`;

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
      'build',
      `${authResourceName}-cloudformation-template.json`,
    );
    let authStackContent = fs.readFileSync(authStackFileName).toString();

    authStackContent = authStackContent.replace('nodejs16.x', 'nodejs10.x');

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

    functionStackContent = functionStackContent.replace(/nodejs\d{1,2}\.x/, 'nodejs10.x');

    fs.writeFileSync(functionStackFileName, functionStackContent, 'utf-8');

    // Executing amplify push triggers the migration
    await amplifyNodeMigrationAndPush(projectRoot);

    projectConfigContent = fs.readFileSync(projectConfigFileName).toString();
    authStackContent = fs.readFileSync(authStackFileName).toString();
    functionStackContent = fs.readFileSync(functionStackFileName).toString();

    expect(projectConfigContent.indexOf('3.1')).toBeGreaterThan(0);
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
