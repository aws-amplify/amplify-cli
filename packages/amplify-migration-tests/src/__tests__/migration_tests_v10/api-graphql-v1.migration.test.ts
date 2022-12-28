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
import { cfnDiffExclusions } from "../../migration-helpers-v10/cfn-diff-exclusions";

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

            // the following excludes a parameter "CreateAPIKey", which is only present in the first project
            // because it gets set to '1' when the API is first created
            const excludeCreateAPIKey = (category, resourceKey, parameters) => {
                if(category === 'api' && resourceKey === projectName.toLocaleLowerCase()){
                    delete parameters.project1.CreateAPIKey;
                }
                return { project1: parameters.project1, project2: parameters.project2 };
            }
            assertNoParameterChangesBetweenProjects(projRoot, projRoot2, { excludeFromParameterDiff: excludeCreateAPIKey });
            expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2, cfnDiffExclusions)).toMatchSnapshot();
            await amplifyPushAuth(projRoot2, true);
            // we don't need to exclude here, because the 2nd project will have "CreateAPIKey" now that it has initiated a push
            assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
            expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2, cfnDiffExclusions)).toMatchSnapshot();
        } finally {
            deleteProjectDir(projRoot2);
        }
    });
})