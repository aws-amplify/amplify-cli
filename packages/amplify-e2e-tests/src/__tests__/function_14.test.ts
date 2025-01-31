import { AmplifyCategories, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import {
  addFunction,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionBuild,
  generateRandomShortId,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import path from 'path';

describe('amplify push function cases:', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('function-pm');
    const projName = `funcpm${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should select the NPM package manager and build', async () => {
    const funcName = `npm${generateRandomShortId()}`;

    await addFunction(projRoot, { name: funcName, packageManager: { name: 'NPM' }, functionTemplate: 'Hello World' }, 'nodejs');
    await functionBuild(projRoot);

    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const amplifyState = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));

    expect(amplifyState.scripts.build).toMatch(/npm.* install --no-bin-links --production/);
  });

  it('should select the YARN package manager and build', async () => {
    const funcName = `yarn${generateRandomShortId()}`;

    await addFunction(projRoot, { name: funcName, packageManager: { name: 'Yarn' }, functionTemplate: 'Hello World' }, 'nodejs');
    await functionBuild(projRoot);

    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const amplifyState = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));

    expect(amplifyState.scripts.build).toMatch(/yarn.* --no-bin-links --production/);
  });

  it('should select the CUSTOM package manager and build', async () => {
    const funcName = `custom${generateRandomShortId()}`;

    await addFunction(
      projRoot,
      { name: funcName, packageManager: { name: 'Custom Build Command or Script Path', command: 'yarn' }, functionTemplate: 'Hello World' },
      'nodejs',
    );
    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const amplifyState = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));
    expect(amplifyState.scripts.build).toMatch(/yarn.*/);

    await functionBuild(projRoot);
  });
});
