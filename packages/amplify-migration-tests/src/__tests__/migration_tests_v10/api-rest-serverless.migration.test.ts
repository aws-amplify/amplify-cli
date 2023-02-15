import { addRestApi, amplifyPull, amplifyPushAuth, amplifyPushUpdateLegacy, createNewProjectDir, deleteProject, deleteProjectDir, getAppId, getProjectMeta, validateRestApiMeta } from "@aws-amplify/amplify-e2e-core";
import { cfnDiffExclusions } from "../../migration-helpers-v10/cfn-diff-exclusions";
import { initJSProjectWithProfileV10 } from "../../migration-helpers-v10/init";
import { assertNoParameterChangesBetweenProjects, collectCloudformationDiffBetweenProjects } from "../../migration-helpers/utils";

describe('api serverless migration tests', () => {
    let projRoot: string;
    let projectName: string;

    afterEach(async () => {
        await deleteProject(projRoot, undefined, true);
        deleteProjectDir(projRoot);
    });

    it('...adds serverless REST api with v10 and pulls without drift in latest version', async () => {
        projectName = 'restDDB';
        projRoot = await createNewProjectDir(projectName);

        await initJSProjectWithProfileV10(projRoot, { name: 'restApiTest', disableAmplifyAppCreation: false });
        await addRestApi(projRoot, { isCrud: false });
        await amplifyPushUpdateLegacy(projRoot);

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

            // validate metadata
            const meta2 = getProjectMeta(projRoot2);
            validateRestApiMeta(projRoot2, meta2);
        } finally {
            deleteProjectDir(projRoot2);
        }
    });
})
