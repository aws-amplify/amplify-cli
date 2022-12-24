import { addApiWithoutSchema, 
    addFunction, 
    amplifyPull, 
    amplifyPush, 
    amplifyPushAuth, 
    amplifyPushWithoutCodegen, 
    createNewProjectDir, 
    deleteProject, 
    deleteProjectDir, 
    generateRandomShortId, 
    getAppId, 
    updateApiSchema, 
    updateFunction } from "@aws-amplify/amplify-e2e-core";
import { initJSProjectWithProfileV10 } from "../../migration-helpers-v10/init";
import { 
    assertNoParameterChangesBetweenProjects, 
    collectCloudformationDiffBetweenProjects, 
} from "../../migration-helpers/utils";

describe('api graphql v1 migration tests', () => {
    let projRoot: string;
    let projectName: string;

    afterEach(async () => {
        await deleteProject(projRoot, undefined, true);
        deleteProjectDir(projRoot);
    });

    // inspired by function_5.test.ts
    it('...adds graphql with v1 transformer, updates models, adds function access, and pulls with latest version', async () => {
        projectName = 'graphqlMigration';
        projRoot = await createNewProjectDir(projectName);
        
        await initJSProjectWithProfileV10(projRoot, { name: projectName, disableAmplifyAppCreation: false });
        await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
        await updateApiSchema(projRoot, projectName, 'simple_model.graphql');
        const fnName = `integtestfn${generateRandomShortId()}`;
        await addFunction(
            projRoot,
            {
                name: fnName,
                functionTemplate: 'Hello World',
            },
            'nodejs',
        );
        await amplifyPush(projRoot);
        await updateApiSchema(projRoot, projectName, 'two-model-schema.graphql');
        await updateFunction(
            projRoot,
            {
                name: fnName,
                functionTemplate: 'Hello World',
                additionalPermissions: {
                permissions: ['storage'],
                choices: ['api', 'function', 'storage'],
                resources: ['Comment:@model(appsync)'],
                resourceChoices: ['Post:@model(appsync)', 'Comment:@model(appsync)'],
                operations: ['read'],
                },
            },
            'nodejs',
        );
        await amplifyPushWithoutCodegen(projRoot, undefined, true);
        
        // pull down with vlatest
        const appId = getAppId(projRoot);
        expect(appId).toBeDefined();
        const projRoot2 = await createNewProjectDir(`${projectName}2`);
        try {
            await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
            assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
            expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
            await amplifyPushAuth(projRoot2, true);
            assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
            expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
        } finally {
            deleteProjectDir(projRoot2);
        }
    });
})