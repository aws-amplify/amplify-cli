import { generateRandomShortId, initJSProjectWithProfile, addApi, updateApiSchema, getBackendConfig, addFunction, functionBuild, amplifyPush, getProjectMeta, getFunction, invokeFunction, createNewProjectDir, deleteProject, deleteProjectDir, amplifyPushFunction, removeFunction } from "@aws-amplify/amplify-e2e-core";


describe('amplify push function cases:', () => {
    let projRoot: string;
  
    beforeEach(async () => {
      projRoot = await createNewProjectDir('lambda-appsync-nodejs');
    });
  
    afterEach(async () => {
    //   await deleteProject(projRoot);
    //   deleteProjectDir(projRoot);
    });

    it('Test case when IAM is set as default auth', async () => {
        const projName = `iammodel${generateRandomShortId()}`;

        await initJSProjectWithProfile(projRoot, { name: projName });

        await addApi(projRoot, { IAM: {}, transformerVersion: 2 });
        await updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');

        expect(getBackendConfig(projRoot)).toBeDefined();

        const beforeMeta = getBackendConfig(projRoot);
        const apiName = Object.keys(beforeMeta.api)[0];

        expect(apiName).toBeDefined();

        await addFunction(
        projRoot,
        {
            functionTemplate: 'AppSync - GraphQL API request (with IAM)',
            additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['Query'],
            name: 'functoosh'
            },
        },
        'nodejs',
        );
        // should fail
        await amplifyPushFunction(projRoot);
        
    });
});
