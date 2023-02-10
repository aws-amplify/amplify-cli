import { addFunction, addRestApi, amplifyPull, amplifyPushAuth, amplifyPushUpdateLegacy, createNewProjectDir, deleteProject, deleteProjectDir, getAppId, getProjectMeta, listAttachedRolePolicies, listRolePolicies, updateAuthAddAdminQueries, validateRestApiMeta } from "@aws-amplify/amplify-e2e-core";
import { cfnDiffExclusions } from "../../migration-helpers-v10/cfn-diff-exclusions";
import { initJSProjectWithProfileV10 } from "../../migration-helpers-v10/init";
import { assertNoParameterChangesBetweenProjects, collectCloudformationDiffBetweenProjects } from "../../migration-helpers/utils";

describe('api lambda migration tests', () => {
    let projRoot: string;
    let projectName: string;

    afterEach(async () => {
        await deleteProject(projRoot, undefined, true);
        deleteProjectDir(projRoot);
    });

    it('...adds lambda with multiple rest APIs with v10 and pulls without drift in latest version', async () => {
        projectName = 'restAdvanced';
        projRoot = await createNewProjectDir(projectName);

        await initJSProjectWithProfileV10(projRoot, { name: 'restApiTest', disableAmplifyAppCreation: false });
        await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
        await addRestApi(projRoot, {
            existingLambda: true,
            restrictAccess: true,
            allowGuestUsers: true,
        });
        await addRestApi(projRoot, {
            isFirstRestApi: false,
            existingLambda: true,
            restrictAccess: true,
            allowGuestUsers: true,
        });
        await addRestApi(projRoot, {
            isFirstRestApi: false,
            existingLambda: true,
            restrictAccess: true,
            allowGuestUsers: false,
        });

        // add more paths to and test policy slicing
        for (let i = 0; i < 15; i++) {
        await addRestApi(projRoot, {
            path: `/items${i}`,
            isFirstRestApi: false,
            existingLambda: true,
            restrictAccess: true,
            allowGuestUsers: true,
        });
        }
        await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true });
        await updateAuthAddAdminQueries(projRoot, undefined, {});
        await amplifyPushUpdateLegacy(projRoot);

        // make sure current project meta is valid
        const meta = getProjectMeta(projRoot);
        validateRestApiMeta(projRoot, meta);

        // pull down with vlatest
        const appId = getAppId(projRoot);
        expect(appId).toBeDefined();
        const projRoot2 = await createNewProjectDir(`${projectName}2`);
        try {
            await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
            assertNoParameterChangesBetweenProjects(projRoot, projRoot2);

            expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2, cfnDiffExclusions)).toMatchSnapshot();
            await amplifyPushAuth(projRoot2, true);
            assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
            expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2, cfnDiffExclusions)).toMatchSnapshot();


            // validate metadata for pulled down project
            const meta2 = getProjectMeta(projRoot2);
            validateRestApiMeta(projRoot2, meta2);

            // validate role policies
            const cfnMeta = meta2.providers.awscloudformation;
            const { AuthRoleName, UnauthRoleName, Region } = cfnMeta;

            // there should be no inline policies attached to the roles
            expect(await listRolePolicies(AuthRoleName, Region)).toEqual([]);
            expect(await listRolePolicies(UnauthRoleName, Region)).toEqual([]);

            // there should be some managed policies attached to the roles
            const authPolicies = await listAttachedRolePolicies(AuthRoleName, Region);
            expect(authPolicies.length).toBeGreaterThan(0);
            for (const { PolicyName } of authPolicies) {
                expect(PolicyName).toMatch(/PolicyAPIGWAuth\d/);
            }
            const unauthPolicies = await listAttachedRolePolicies(UnauthRoleName, Region);
            expect(unauthPolicies.length).toBeGreaterThan(0);
            for (const { PolicyName } of unauthPolicies) {
                expect(PolicyName).toMatch(/PolicyAPIGWUnauth\d/);
            }
        } finally {
            deleteProjectDir(projRoot2);
        }
    });
})
