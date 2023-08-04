import {
  initJSProjectWithProfile,
  deleteProject,
  createNewProjectDir,
  deleteProjectDir,
  addApiWithoutSchema,
  addCustomResolver,
  apiGqlCompile,
  updateApiSchema,
  writeToCustomResourcesJson,
  amplifyPush,
  amplifyPushGraphQlWithCognitoPrompt,
  generateModels,
  amplifyPushUpdate,
} from '@aws-amplify/amplify-e2e-core';
import { join } from 'path';
import * as fs from 'fs-extra';

describe('user created resolvers', () => {
  let projectDir: string;
  const apiName = 'simpleapi';

  beforeEach(async () => {
    projectDir = await createNewProjectDir('overrideresolvers');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  describe('overriding generated resolvers', () => {
    it('adds the overwritten resolver to the build', async () => {
      const resolverName = 'Query.listTodos.req.vtl';
      const resolver = '$util.unauthorized()';
      const generatedResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', resolverName);

      await addApiWithoutSchema(projectDir, { apiName });
      await updateApiSchema(projectDir, apiName, 'simple_model.graphql');
      await apiGqlCompile(projectDir);

      expect(fs.readFileSync(generatedResolverPath).toString()).not.toEqual(resolver);

      addCustomResolver(projectDir, apiName, resolverName, resolver);
      await apiGqlCompile(projectDir);

      expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(resolver);
    });

    it('overriding a resolver should not create duplicate function', async () => {
      const slotName = 'Query.listTodos.auth.1.req.vtl';
      const slot = '$util.unauthorized()';
      const generatedResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', slotName);
      const overriddenResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'resolvers', slotName);

      await addApiWithoutSchema(projectDir, { apiName });
      updateApiSchema(projectDir, apiName, 'cognito_simple_model.graphql');
      await amplifyPushGraphQlWithCognitoPrompt(projectDir);

      expect(fs.existsSync(generatedResolverPath)).toEqual(true);

      addCustomResolver(projectDir, apiName, slotName, slot);
      await generateModels(projectDir);
      await amplifyPushUpdate(projectDir);

      const todoJsonPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'Todo.json');
      const todoJson = JSON.parse(fs.readFileSync(todoJsonPath).toString());

      expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(slot);
      expect(fs.readFileSync(overriddenResolverPath).toString()).toEqual(slot);
      const getResolverAppsyncFunctions = todoJson.Resources.GetTodoResolver.Properties.PipelineConfig.Functions;
      const listResolverAppsyncFunctions = todoJson.Resources.ListTodoResolver.Properties.PipelineConfig.Functions;

      expect(getResolverAppsyncFunctions).toHaveLength(3);
      // The function count should be 3 even after overriding the auth resolver
      expect(listResolverAppsyncFunctions).toHaveLength(3);

      // checking if deduplication isn't removing overrided slot
      // 1. postAuth slot appsync functions should be same
      // 2. list resolver auth slot should be different

      const filterFunctions = listResolverAppsyncFunctions.filter((func1) =>
        getResolverAppsyncFunctions.some((func2) => func1['Fn::GetAtt'][0] === func2['Fn::GetAtt'][0]),
      );
      expect(filterFunctions).toMatchInlineSnapshot(`
        [
          {
            "Fn::GetAtt": [
              "QuerygetTodopostAuth0FunctionQuerygetTodopostAuth0FunctionAppSyncFunction6BE14593",
              "FunctionId",
            ],
          },
        ]
      `);
      expect(listResolverAppsyncFunctions.filter((obj) => obj['Fn::GetAtt'][0].includes('QuerylistTodosauth0Function')))
        .toMatchInlineSnapshot(`
        [
          {
            "Fn::GetAtt": [
              "QuerylistTodosauth0FunctionQuerylistTodosauth0FunctionAppSyncFunction7D761961",
              "FunctionId",
            ],
          },
        ]
      `);
    });
  });

  describe('adding user defined slots', () => {
    it('adds the slot to the project and uploads the function to AppSync', async () => {
      const slotName = 'Query.listTodos.postAuth.2.req.vtl';
      const slot = '$util.unauthorized()';
      const generatedResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', slotName);

      await addApiWithoutSchema(projectDir, { apiName });
      updateApiSchema(projectDir, apiName, 'model_with_sandbox_mode.graphql');
      await amplifyPush(projectDir);

      expect(fs.existsSync(generatedResolverPath)).toEqual(false);

      addCustomResolver(projectDir, apiName, slotName, slot);
      await generateModels(projectDir);
      await amplifyPushUpdate(projectDir);

      const todoJsonPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'Todo.json');
      const todoJson = JSON.parse(fs.readFileSync(todoJsonPath).toString());

      expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(slot);
      expect(todoJson.Resources.GetTodoResolver.Properties.PipelineConfig.Functions).toHaveLength(2);
      expect(todoJson.Resources.ListTodoResolver.Properties.PipelineConfig.Functions).toHaveLength(3);
    });
  });

  describe('custom resolvers', () => {
    it('adds the overwritten resolver to the build', async () => {
      const resolverReqName = 'Query.commentsForTodo.req.vtl';
      const resolverResName = 'Query.commentsForTodo.res.vtl';

      const resolverReq = '$util.unauthorized()';
      const resolverRes = '$util.toJson({})';

      const generatedReqResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', resolverReqName);
      const generatedResResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', resolverResName);
      const stackPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'CustomResources.json');

      const Resources = {
        Resources: {
          QueryCommentsForTodoResolver: {
            Type: 'AWS::AppSync::Resolver',
            Properties: {
              ApiId: {
                Ref: 'AppSyncApiId',
              },
              DataSourceName: 'CommentTable',
              TypeName: 'Query',
              FieldName: 'commentsForTodo',
              RequestMappingTemplateS3Location: {
                'Fn::Sub': [
                  's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/Query.commentsForTodo.req.vtl',
                  {
                    S3DeploymentBucket: {
                      Ref: 'S3DeploymentBucket',
                    },
                    S3DeploymentRootKey: {
                      Ref: 'S3DeploymentRootKey',
                    },
                  },
                ],
              },
              ResponseMappingTemplateS3Location: {
                'Fn::Sub': [
                  's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/Query.commentsForTodo.res.vtl',
                  {
                    S3DeploymentBucket: {
                      Ref: 'S3DeploymentBucket',
                    },
                    S3DeploymentRootKey: {
                      Ref: 'S3DeploymentRootKey',
                    },
                  },
                ],
              },
            },
          },
        },
      };

      await addApiWithoutSchema(projectDir, { apiName });
      await updateApiSchema(projectDir, apiName, 'custom_query.graphql');
      await apiGqlCompile(projectDir);

      addCustomResolver(projectDir, apiName, resolverReqName, resolverReq);
      addCustomResolver(projectDir, apiName, resolverResName, resolverRes);
      writeToCustomResourcesJson(projectDir, apiName, Resources);

      await apiGqlCompile(projectDir);

      expect(fs.readFileSync(generatedReqResolverPath).toString()).toEqual(resolverReq);
      expect(fs.readFileSync(generatedResResolverPath).toString()).toEqual(resolverRes);
      expect(JSON.parse(fs.readFileSync(stackPath).toString()).Resources).toEqual(Resources.Resources);
    });
  });
});
