import path from 'path';
import fs from 'fs-extra';
import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionCloudInvoke,
  functionMockAssert,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import { AmplifyCategories, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';

/**
 * These tests check that functions created with .NET Core 3.1 templates keep working after we drop support to create them.
 */
describe('existing dotnet core functions compatibility test', () => {
  let projRoot: string;
  let funcName: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion} to ${migrateToVersion}`);
    // expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v); // uncomment this once we are in v11 for local codebase
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('netmigrationtest');
    funcName = `dotnettestfn${generateRandomShortId()}`;
    await initJSProjectWithProfileV10(projRoot, { name: 'netmigrationtest' });
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnetCore31',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  const assertDotNetVersion = (): void => {
    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const { functionRuntime } = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));
    expect(functionRuntime).toEqual('dotnetcore3.1');
    const functionProjFilePath = path.join(functionPath, 'src', `${funcName}.csproj`);
    const functionProjFileContent = fs.readFileSync(functionProjFilePath, 'utf8');
    expect(functionProjFileContent).toContain('<TargetFramework>netcoreapp3.1</TargetFramework>');
  };

  it('use dotnet hello world function and invoke in the cloud', async () => {
    const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
    await amplifyPushAuth(projRoot, true);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual({
      key1: 'VALUE1',
      key2: 'VALUE2',
      key3: 'VALUE3',
    });

    assertDotNetVersion();
  });

  it('use dotnet hello world function and mock locally', async () => {
    await functionMockAssert(
      projRoot,
      {
        funcName,
        successString: '  "key3": "VALUE3"',
        eventFile: 'src/event.json',
      },
      true,
    ); // will throw if successString is not in output

    assertDotNetVersion();
  });
});
