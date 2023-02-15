import { JSONUtilities } from 'amplify-cli-core';
import {
  addCDKCustomResource,
  addCFNCustomResource,
  amplifyPull,
  amplifyPushAuth,
  amplifyPushAuthV10,
  buildCustomResources,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import { assertNoParameterChangesBetweenProjects, collectCloudformationDiffBetweenProjects } from '../../migration-helpers/utils';

describe('adding custom resources migration test', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('custom-resources');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add/update CDK and CFN custom resources', async () => {
    const cdkResourceName = `custom${uuid().split('-')[0]}`;
    const cfnResourceName = `custom${uuid().split('-')[0]}`;

    await initJSProjectWithProfileV10(projRoot, { name: 'customMigration', disableAmplifyAppCreation: false });
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();

    await addCDKCustomResource(projRoot, { name: cdkResourceName });

    // this is where we will write our custom cdk stack logic to
    const destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
    const cfnFilePath = path.join(
      projRoot,
      'amplify',
      'backend',
      'custom',
      cdkResourceName,
      'build',
      `${cdkResourceName}-cloudformation-template.json`,
    );
    const srcCustomResourceFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cdk-stack-v10.ts');
    fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
    await buildCustomResources(projRoot);
    await amplifyPushAuthV10(projRoot);

    // check if cfn file is generated in the build dir
    expect(fs.existsSync(cfnFilePath)).toEqual(true);
    const buildCFNFileJSON: any = JSONUtilities.readJson(cfnFilePath);
    // Basic sanity generated CFN file content check
    expect(buildCFNFileJSON?.Parameters).toEqual({
      env: { Type: 'String', Description: 'Current Amplify CLI env name' },
    });
    expect(Object.keys(buildCFNFileJSON?.Outputs)).toEqual(['snsTopicArn']);
    const meta = getProjectMeta(projRoot);
    const { snsTopicArn: customResourceSNSArn } = Object.keys(meta.custom).map(key => meta.custom[key])[0].output;
    expect(customResourceSNSArn).toBeDefined();

    // using latest code, pull down the project
    const projRoot2 = await createNewProjectDir('customMigration2');
    const usingLatestCode = true;
    try {
      await amplifyPull(projRoot2, { emptyDir: true, appId }, usingLatestCode);
      assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
      expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
      await amplifyPushAuth(projRoot2, usingLatestCode);
      assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
      expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();

      // building custom resources succeeds against a v10 cdk stack, even when using vLatest to build
      await expect(buildCustomResources(projRoot2, usingLatestCode)).resolves.not.toThrow();

      // migrate overrides to use vLatest
      const srcVLatestCustomResourceFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cdk-stack-vLatest.ts');
      const destVLatestCustomResourceFilePath = path.join(projRoot2, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
      fs.copyFileSync(srcVLatestCustomResourceFilePath, destVLatestCustomResourceFilePath);

      // this should fail because customer also needs to update package.json dependencies for cdkV2
      await expect(buildCustomResources(projRoot2, usingLatestCode)).rejects.toThrow();

      // emulate updating the package.json dependencies
      const srcVLatestCustomPackageJSONFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cdk-stack-vLatest.package.json');
      const destVLatestCustomPackageJSONFilePath = path.join(projRoot2, 'amplify', 'backend', 'custom', cdkResourceName, 'package.json');
      fs.copyFileSync(srcVLatestCustomPackageJSONFilePath, destVLatestCustomPackageJSONFilePath);

      // this should pass now
      await buildCustomResources(projRoot2, usingLatestCode);
      await amplifyPushAuth(projRoot2, usingLatestCode);

      // // Using latest code, add custom CFN and add dependency of custom CDK resource on the custom CFN
      await addCFNCustomResource(projRoot2, { name: cfnResourceName, promptForCategorySelection: false }, usingLatestCode);
      const customCFNFilePath = path.join(
        projRoot2,
        'amplify',
        'backend',
        'custom',
        cfnResourceName,
        `${cfnResourceName}-cloudformation-template.json`,
      );
      const customCFNFileJSON: any = JSONUtilities.readJson(customCFNFilePath);
      // Make sure input params has params from the resource dependency
      expect(customCFNFileJSON?.Parameters).toEqual({
        env: { Type: 'String' },
        [`custom${cdkResourceName}snsTopicArn`]: {
          Type: 'String',
          Description: `Input parameter describing snsTopicArn attribute for custom/${cdkResourceName} resource`,
        },
      });
    } finally {
      deleteProjectDir(projRoot2);
    }
  });
});
