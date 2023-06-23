import {
  amplifyPush,
  deleteProject,
  initJSProjectWithProfile,
  createNewProjectDir,
  deleteProjectDir,
  generateRandomShortId,
  getProjectMetaPath,
  addApiWithBlankSchema,
  updateApiSchema,
  amplifyPushUpdate,
} from '@aws-amplify/amplify-e2e-core';
import fs from 'fs';
import path from 'path';

describe('minify behavior', () => {
  let projRoot: string;
  let projFolderName: string;

  beforeEach(async () => {
    projFolderName = `minify${generateRandomShortId()}`;
    projRoot = await createNewProjectDir(projFolderName);
  });

  afterEach(async () => {
    if (fs.existsSync(getProjectMetaPath(projRoot))) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('reduces file size when minify flag is provided', async () => {
    const envName = 'devtest';
    const projName = `minify${generateRandomShortId()}`;

    // Configure and push app without minification
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithBlankSchema(projRoot);
    updateApiSchema(projRoot, projName, 'simple_model.graphql', false);
    await amplifyPush(projRoot, false, { minify: false });

    // Read Cfn file sizes for both nested API stacks and top-level stacks
    const currentCloudBackendPath = path.join(projRoot, 'amplify', '#current-cloud-backend');

    const nestedApiStackPath = path.join(currentCloudBackendPath, 'api', projName, 'build', 'stacks', 'Todo.json');
    const rootApiStackPath = path.join(
      currentCloudBackendPath,
      'awscloudformation',
      'build',
      'api',
      projName,
      'build',
      'cloudformation-template.json',
    );
    const rootStackPath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');

    const unminifiedNestedApiStackDefinition = fs.readFileSync(nestedApiStackPath, 'utf-8');
    const unminifiedRootApiStackDefinition = fs.readFileSync(rootApiStackPath, 'utf-8');
    const unminifiedRootStackDefinition = fs.readFileSync(rootStackPath, 'utf-8');

    // Tweak schema file and push with minification
    updateApiSchema(projRoot, projName, 'simple_model.graphql', true);
    const pushParams = {
      projRoot,
      waitForText: undefined,
      useLatestCodebase: false,
      destructivePush: false,
      overrideTimeout: 0,
      minify: true,
    };
    await amplifyPushUpdate(
      pushParams.projRoot,
      pushParams.waitForText,
      pushParams.waitForText,
      pushParams.destructivePush,
      pushParams.overrideTimeout,
      pushParams.minify,
    );

    // Read Cfn file sizes for both nested API stacks and top-level stacks, verify files are smaller than initial push.
    const minifiedNestedApiStackDefinition = fs.readFileSync(nestedApiStackPath, 'utf-8');
    const minifiedRootApiStackDefinition = fs.readFileSync(rootApiStackPath, 'utf-8');
    const minifiedRootStackDefinition = fs.readFileSync(rootStackPath, 'utf-8');

    expect(minifiedNestedApiStackDefinition.length).toBeLessThan(unminifiedNestedApiStackDefinition.length);
    expect(minifiedRootApiStackDefinition.length).toBeLessThan(unminifiedRootApiStackDefinition.length);
    expect(minifiedRootStackDefinition.length).toBeLessThan(unminifiedRootStackDefinition.length);
  });
});
