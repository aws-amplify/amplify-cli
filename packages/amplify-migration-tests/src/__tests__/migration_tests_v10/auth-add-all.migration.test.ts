import {
    addAuthWithDefault,
    addAuthWithMaxOptions,
    amplifyPull,
    amplifyPushAuth,
    amplifyPushWithoutCodegen,
    createNewProjectDir,
    deleteProject,
    deleteProjectDir,
    getAppId,
    removeAuthWithDefault,
  } from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import { assertNoParameterChangesBetweenProjects, collectCloudformationDiffBetweenProjects, ExcludeFromCFNDiff } from '../../migration-helpers/utils';

/**
 * Due to a known limitation of APIGateway, we do not want the AWS::ApiGateway::Deployment resource
 * from being compared in the CFN diff because it is regenerated whenever an amplify app is pulled down.
 * This would produce a false positive when checking for differences in the CFN templates of project1 & project2.
 * https://github.com/aws/aws-cdk/issues/8646#issuecomment-647561856
 */
const cfnDiffExclusions: ExcludeFromCFNDiff = (currentCategory: string, currentResourceKey: string, cfnTemplates: {
  project1: any;
  project2: any;
}) => {
  const excludeAPIGateWayDeploymentResource = (cfnTemplate: any): any => {
    const resources = cfnTemplate.Resources ?? {};
    const resourceKeys = Object.keys(resources);
    for(let key of resourceKeys){
      const resource = resources[key];
      if(resource.Type === 'AWS::ApiGateway::Deployment'){
        delete resources[key];
      }
    }
  }
  if(currentCategory === 'api'){
    excludeAPIGateWayDeploymentResource(cfnTemplates.project1);
    excludeAPIGateWayDeploymentResource(cfnTemplates.project2);
  }
  return { project1: cfnTemplates.project1, project2: cfnTemplates.project2 };
}
  
describe('amplify migration test auth', () => {
    let projRoot1: string;
  
    beforeAll(async () => {
      const migrateFromVersion = { v: 'unintialized' };
      const migrateToVersion = { v: 'unintialized' };
      await versionCheck(process.cwd(), false, migrateFromVersion);
      await versionCheck(process.cwd(), true, migrateToVersion);
      console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
      expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
      expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    });
  
    beforeEach(async () => {
      projRoot1 = await createNewProjectDir('authMigration1');
    });
  
    afterEach(async () => {
      // note - this deletes the original project using the latest codebase
      await deleteProject(projRoot1, null, true);
      deleteProjectDir(projRoot1);
    });
  
    it('...should add auth with max options and work on the latest version', async () => {
      await initJSProjectWithProfileV10(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
      
      await addAuthWithMaxOptions(projRoot1, {});
      await amplifyPushAuth(projRoot1);

      const appId = getAppId(projRoot1);
      expect(appId).toBeDefined();
      const projRoot2 = await createNewProjectDir('authMigration2');
      
      try {
        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
        expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2, cfnDiffExclusions)).toMatchSnapshot();
        await amplifyPushWithoutCodegen(projRoot2, true);
        assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
        expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2, cfnDiffExclusions)).toMatchSnapshot();

        // should be able to remove & add auth after pulling down an older project
        await removeAuthWithDefault(projRoot2, true);
        await addAuthWithDefault(projRoot2, {}, true);
        await amplifyPushAuth(projRoot2, true);
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
});
  