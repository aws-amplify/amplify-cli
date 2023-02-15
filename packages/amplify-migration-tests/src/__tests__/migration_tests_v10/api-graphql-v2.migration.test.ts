import { addApiWithoutSchema,
    amplifyOverrideApi,
    amplifyPull,
    amplifyPushLegacy,
    amplifyPushAuth,
    amplifyPushOverride,
    createNewProjectDir,
    deleteProject,
    deleteProjectDir,
    getAppId,
    getAppSyncApi,
    getProjectMeta,
    updateApiSchema } from "@aws-amplify/amplify-e2e-core";
import { initJSProjectWithProfileV10 } from "../../migration-helpers-v10/init";
import { assertNoParameterChangesBetweenProjects,
    collectCloudformationDiffBetweenProjects } from "../../migration-helpers/utils";
import * as fs from 'fs-extra';
import path from 'path';
import { cfnDiffExclusions } from "../../migration-helpers-v10/cfn-diff-exclusions";

describe('api graphql v2 migration tests', () => {
    let projRoot: string;

    afterEach(async () => {
        await deleteProject(projRoot, undefined, true);
        deleteProjectDir(projRoot);
    });

    // inspired by api_7.test.ts
    it('...adds graphql with v2 transformer, adds overrides, and pulls in latest version', async () => {
        const projectName = 'gqmigration';
        projRoot = await createNewProjectDir(projectName);

        await initJSProjectWithProfileV10(projRoot, { name: projectName, disableAmplifyAppCreation: false });
        await addApiWithoutSchema(projRoot);
        await updateApiSchema(projRoot, projectName, 'simple_model.graphql');
        await amplifyPushLegacy(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        // eslint-disable-next-line spellcheck/spell-checker
        const { output } = meta.api.gqmigration;
        const { GraphQLAPIIdOutput } = output;

        // add overrides
        await amplifyOverrideApi(projRoot);
        const srcOverrideFilePath = path.join(__dirname, '..', '..', '..', 'overrides', 'override-api-gql.v10.ts');
        const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'api', `${projectName}`, 'override.ts');
        fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
        await amplifyPushOverride(projRoot);

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

            // check overridden config in cloud after pushing with vLatest
            const overriddenAppsyncApiOverride = await getAppSyncApi(GraphQLAPIIdOutput, region);
            expect(overriddenAppsyncApiOverride.graphqlApi).toBeDefined();
            expect(overriddenAppsyncApiOverride.graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
            // eslint-disable-next-line spellcheck/spell-checker
            expect(overriddenAppsyncApiOverride.graphqlApi.xrayEnabled).toEqual(true);
        } finally {
            deleteProjectDir(projRoot2);
        }
    });
})
