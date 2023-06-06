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

describe('amplify push function cases:', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('function-pm');
    const projName = `func-pm-${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it.only('should select the NPM package manager and build', async () => {
    const funcName = `npm-${generateRandomShortId()}`;

    await addFunction(projRoot, { name: funcName, packageManager: { name: 'NPM' }, functionTemplate: 'Hello World' }, 'nodejs');
    await functionBuild(projRoot);

    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const { functionRuntime } = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));

    expect(functionRuntime.scripts.build).toEqual('npm run build');
  });

  it('should select the YARN package manager and build', async () => {
    const funcName = `yarn-${generateRandomShortId()}`;

    await addFunction(projRoot, { name: funcName, packageManager: { name: 'Yarn' }, functionTemplate: 'Hello World' }, 'nodejs');
    await functionBuild(projRoot);

    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const { functionRuntime } = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));

    expect(functionRuntime.scripts.build).toEqual('yarn');
  });

  it('should select the CUSTOM package manager and build', async () => {
    const funcName = `custom-${generateRandomShortId()}`;

    await addFunction(
      projRoot,
      { name: funcName, packageManager: { name: 'CUSTOM', command: 'yarn' }, functionTemplate: 'Hello World' },
      'nodejs',
    );
    await functionBuild(projRoot);

    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const { functionRuntime } = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));

    expect(functionRuntime.scripts.build).toEqual('yarn');
  });
});
