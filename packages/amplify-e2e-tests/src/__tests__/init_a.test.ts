/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  deleteProject,
  getAdminApp,
  amplifyPullSandbox,
  amplifyInitSandbox,
  getProjectSchema,
  amplifyPush,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';

import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

import { SandboxApp } from '../types/SandboxApp';

describe('amplify init a', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should pull sandbox and download schema', async () => {
    const schemaBody = {
      schema:
        '    type Todo @model @auth(rules: [{allow: public}]) {        id: ID!        name: String!        description: String    }    ',
      shareable: 'true',
    };
    const sandBoxAppString = await getAdminApp(schemaBody);
    expect(sandBoxAppString).toBeDefined();
    const sandboxApp = JSONUtilities.parse<SandboxApp>(sandBoxAppString);
    expect(sandboxApp.schema).toEqual(schemaBody.schema);
    await amplifyPullSandbox(projRoot, {
      appType: 'javascript',
      framework: 'angular',
      sandboxId: sandboxApp.backendManagerAppId,
    });
    await amplifyInitSandbox(projRoot, {});
    const projectSchema = getProjectSchema(projRoot, 'amplifyDatasource');
    expect(projectSchema).toEqual(schemaBody.schema);

    const awsExportsPath = path.join(projRoot, 'src', 'aws-exports.js');
    const modelsIndexPath = path.join(projRoot, 'src', 'models', 'index.js');
    const modelsSchemaPath = path.join(projRoot, 'src', 'models', 'schema.js');
    expect(fs.existsSync(awsExportsPath) && fs.existsSync(modelsIndexPath) && fs.existsSync(modelsSchemaPath)).toBe(true);

    await amplifyPush(projRoot);
  });
});
