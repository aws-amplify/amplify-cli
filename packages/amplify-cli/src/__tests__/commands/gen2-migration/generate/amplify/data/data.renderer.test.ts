import { GraphqlApi } from '@aws-sdk/client-appsync';
import { DataRenderer, DataRenderOptions } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer';
import { ClassifiedVtlFiles, classifyVtlFiles } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import { TS } from '../../../../../../commands/gen2-migration/generate/ts';

jest.unmock('fs-extra');

/**
 * Helper to render only the applyEscapeHatches portion of the output.
 * Extracts the function body from the full rendered file.
 */
function renderResolverOutput(classifiedResolvers: ClassifiedVtlFiles): string {
  const renderer = new DataRenderer('dev');
  const opts: DataRenderOptions = {
    schema: 'type Todo @model { id: ID! }',
    tableMappings: { Todo: 'Todo-abc-dev' },
    graphqlApi: { apiId: 'abc', name: 'testApi', additionalAuthenticationProviders: [] } as unknown as GraphqlApi,
    classifiedResolvers,
  };
  const nodes = renderer.render(opts);
  return TS.printNodes(nodes);
}

describe('DataRenderer - resolver code generation', () => {
  describe('override resolvers only', () => {
    it('generates override loop for 4-segment VTL files', () => {
      const classified = classifyVtlFiles(['Query.getTodo.req.vtl', 'Query.getTodo.res.vtl']);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { readdirSync } from 'fs';
        import * as assets from 'aws-cdk-lib/aws-s3-assets';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          const overiddenResolverFiles = readdirSync(resolversDir).filter(
            (f) =>
              (f.endsWith('.req.vtl') || f.endsWith('.res.vtl')) &&
              f.split('.').length === 4
          );
          for (const file of overiddenResolverFiles) {
            const [typeName, fieldName, templateType] = file.split('.');
            const capitalizedFieldName =
              fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            const functionId = \`\${typeName}\${capitalizedFieldName}DataResolverFn\`;
            const fn =
              backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
            const vtlTemplate = new assets.Asset(backend.data, \`VTLTemplate-\${file}\`, {
              path: join(resolversDir, file),
            });
            if (templateType === 'req') {
              fn.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            } else {
              fn.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            }
          }
        }
        "
      `);
    });
  });

  describe('extended resolvers only', () => {
    it('generates AppsyncFunction + splice for a single extended resolver (init slot on create Mutation)', () => {
      const classified = classifyVtlFiles(['Mutation.createTodo.init.1.req.vtl']);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const MutationcreateTodoinit1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodoinit1',
            {
              name: 'MutationcreateTodoinit1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const mutationCreateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.createTodo'] as CfnResolver;
          const mutationCreateTodoPipelineFunctions =
            (
              mutationCreateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationCreateTodoPipelineFunctions.splice(
            1,
            0,
            MutationcreateTodoinit1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    it('generates multiple AppsyncFunctions + splices for init and finish slots on create Mutation', () => {
      const classified = classifyVtlFiles(['Mutation.createTodo.init.2.req.vtl', 'Mutation.createTodo.finish.1.res.vtl']);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const MutationcreateTodoinit2 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodoinit2',
            {
              name: 'MutationcreateTodoinit2',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.2.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const MutationcreateTodofinish1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodofinish1',
            {
              name: 'MutationcreateTodofinish1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate:
                aws_appsync.MappingTemplate.fromString('$util.toJson({})'),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.finish.1.res.vtl')
              ),
            }
          );
          const mutationCreateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.createTodo'] as CfnResolver;
          const mutationCreateTodoPipelineFunctions =
            (
              mutationCreateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationCreateTodoPipelineFunctions.splice(
            1,
            0,
            MutationcreateTodoinit2.functionId
          );
          mutationCreateTodoPipelineFunctions.splice(
            5,
            0,
            MutationcreateTodofinish1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    it('generates splice for Query resolver using 3-function pipeline', () => {
      const classified = classifyVtlFiles(['Query.listTodos.postDataLoad.1.req.vtl', 'Query.listTodos.postDataLoad.1.res.vtl']);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const QuerylistTodospostDataLoad1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'QuerylistTodospostDataLoad1',
            {
              name: 'QuerylistTodospostDataLoad1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Query.listTodos.postDataLoad.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Query.listTodos.postDataLoad.1.res.vtl')
              ),
            }
          );
          const queryListTodosResolver = backend.data.resources.cfnResources
            .cfnResolvers['Query.listTodos'] as CfnResolver;
          const queryListTodosPipelineFunctions =
            (
              queryListTodosResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          queryListTodosPipelineFunctions.splice(
            3,
            0,
            QuerylistTodospostDataLoad1.functionId
          );
          queryListTodosResolver.pipelineConfig = {
            functions: queryListTodosPipelineFunctions,
          };
        }
        "
      `);
    });
  });

  describe('mixed override and extended resolvers', () => {
    it('generates both override loop and extended splice for combined scenario', () => {
      const classified = classifyVtlFiles([
        // Override: 4-segment files
        'Query.getTodo.req.vtl',
        'Query.getTodo.res.vtl',
        // Extended: 6-segment files
        'Mutation.createTodo.init.2.req.vtl',
        'Mutation.createTodo.finish.1.res.vtl',
      ]);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { readdirSync } from 'fs';
        import * as assets from 'aws-cdk-lib/aws-s3-assets';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          const overiddenResolverFiles = readdirSync(resolversDir).filter(
            (f) =>
              (f.endsWith('.req.vtl') || f.endsWith('.res.vtl')) &&
              f.split('.').length === 4
          );
          for (const file of overiddenResolverFiles) {
            const [typeName, fieldName, templateType] = file.split('.');
            const capitalizedFieldName =
              fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            const functionId = \`\${typeName}\${capitalizedFieldName}DataResolverFn\`;
            const fn =
              backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
            const vtlTemplate = new assets.Asset(backend.data, \`VTLTemplate-\${file}\`, {
              path: join(resolversDir, file),
            });
            if (templateType === 'req') {
              fn.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            } else {
              fn.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            }
          }
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const MutationcreateTodoinit2 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodoinit2',
            {
              name: 'MutationcreateTodoinit2',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.2.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const MutationcreateTodofinish1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodofinish1',
            {
              name: 'MutationcreateTodofinish1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate:
                aws_appsync.MappingTemplate.fromString('$util.toJson({})'),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.finish.1.res.vtl')
              ),
            }
          );
          const mutationCreateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.createTodo'] as CfnResolver;
          const mutationCreateTodoPipelineFunctions =
            (
              mutationCreateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationCreateTodoPipelineFunctions.splice(
            1,
            0,
            MutationcreateTodoinit2.functionId
          );
          mutationCreateTodoPipelineFunctions.splice(
            5,
            0,
            MutationcreateTodofinish1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    it('generates extended resolvers across multiple fields', () => {
      const classified = classifyVtlFiles([
        'Mutation.createTodo.init.1.req.vtl',
        'Mutation.createTodo.init.1.res.vtl',
        'Query.listTodos.postDataLoad.1.req.vtl',
      ]);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const MutationcreateTodoinit1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodoinit1',
            {
              name: 'MutationcreateTodoinit1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.1.res.vtl')
              ),
            }
          );
          const mutationCreateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.createTodo'] as CfnResolver;
          const mutationCreateTodoPipelineFunctions =
            (
              mutationCreateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationCreateTodoPipelineFunctions.splice(
            1,
            0,
            MutationcreateTodoinit1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
          const QuerylistTodospostDataLoad1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'QuerylistTodospostDataLoad1',
            {
              name: 'QuerylistTodospostDataLoad1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Query.listTodos.postDataLoad.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const queryListTodosResolver = backend.data.resources.cfnResources
            .cfnResolvers['Query.listTodos'] as CfnResolver;
          const queryListTodosPipelineFunctions =
            (
              queryListTodosResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          queryListTodosPipelineFunctions.splice(
            3,
            0,
            QuerylistTodospostDataLoad1.functionId
          );
          queryListTodosResolver.pipelineConfig = {
            functions: queryListTodosPipelineFunctions,
          };
        }
        "
      `);
    });

    it('generates overrides + extended resolvers across Query, Mutation, and Subscription', () => {
      const classified = classifyVtlFiles([
        // Overrides
        'Mutation.createTodo.req.vtl',
        'Query.getTodo.res.vtl',
        // Extended: multiple fields and operation types
        'Mutation.createTodo.init.1.req.vtl',
        'Mutation.createTodo.init.1.res.vtl',
        'Mutation.createTodo.finish.1.res.vtl',
        'Query.listTodos.postDataLoad.1.req.vtl',
        'Subscription.onCreateTodo.preAuth.1.req.vtl',
      ]);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { readdirSync } from 'fs';
        import * as assets from 'aws-cdk-lib/aws-s3-assets';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          const overiddenResolverFiles = readdirSync(resolversDir).filter(
            (f) =>
              (f.endsWith('.req.vtl') || f.endsWith('.res.vtl')) &&
              f.split('.').length === 4
          );
          for (const file of overiddenResolverFiles) {
            const [typeName, fieldName, templateType] = file.split('.');
            const capitalizedFieldName =
              fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            const functionId = \`\${typeName}\${capitalizedFieldName}DataResolverFn\`;
            const fn =
              backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
            const vtlTemplate = new assets.Asset(backend.data, \`VTLTemplate-\${file}\`, {
              path: join(resolversDir, file),
            });
            if (templateType === 'req') {
              fn.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            } else {
              fn.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            }
          }
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const MutationcreateTodoinit1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodoinit1',
            {
              name: 'MutationcreateTodoinit1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.init.1.res.vtl')
              ),
            }
          );
          const MutationcreateTodofinish1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodofinish1',
            {
              name: 'MutationcreateTodofinish1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate:
                aws_appsync.MappingTemplate.fromString('$util.toJson({})'),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.finish.1.res.vtl')
              ),
            }
          );
          const mutationCreateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.createTodo'] as CfnResolver;
          const mutationCreateTodoPipelineFunctions =
            (
              mutationCreateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationCreateTodoPipelineFunctions.splice(
            1,
            0,
            MutationcreateTodoinit1.functionId
          );
          mutationCreateTodoPipelineFunctions.splice(
            5,
            0,
            MutationcreateTodofinish1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
          const QuerylistTodospostDataLoad1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'QuerylistTodospostDataLoad1',
            {
              name: 'QuerylistTodospostDataLoad1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Query.listTodos.postDataLoad.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const queryListTodosResolver = backend.data.resources.cfnResources
            .cfnResolvers['Query.listTodos'] as CfnResolver;
          const queryListTodosPipelineFunctions =
            (
              queryListTodosResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          queryListTodosPipelineFunctions.splice(
            3,
            0,
            QuerylistTodospostDataLoad1.functionId
          );
          queryListTodosResolver.pipelineConfig = {
            functions: queryListTodosPipelineFunctions,
          };
          const SubscriptiononCreateTodopreAuth1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'SubscriptiononCreateTodopreAuth1',
            {
              name: 'SubscriptiononCreateTodopreAuth1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Subscription.onCreateTodo.preAuth.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const subscriptionOnCreateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Subscription.onCreateTodo'] as CfnResolver;
          const subscriptionOnCreateTodoPipelineFunctions =
            (
              subscriptionOnCreateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          subscriptionOnCreateTodoPipelineFunctions.splice(
            0,
            0,
            SubscriptiononCreateTodopreAuth1.functionId
          );
          subscriptionOnCreateTodoResolver.pipelineConfig = {
            functions: subscriptionOnCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    it('generates overrides + extended resolvers with multiple slots on delete Mutation (3-function pipeline)', () => {
      const classified = classifyVtlFiles([
        // Override
        'Mutation.deleteTodo.req.vtl',
        // Extended on delete (uses 3-function pipeline)
        'Mutation.deleteTodo.preAuth.1.req.vtl',
        'Mutation.deleteTodo.postAuth.1.req.vtl',
        'Mutation.deleteTodo.postAuth.1.res.vtl',
        // Extended on update (uses 4-function pipeline)
        'Mutation.updateTodo.preUpdate.1.req.vtl',
        'Mutation.updateTodo.preUpdate.1.res.vtl',
      ]);

      const output = renderResolverOutput(classified);

      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';
        import { join, dirname } from 'path';
        import { fileURLToPath } from 'url';
        import { readdirSync } from 'fs';
        import * as assets from 'aws-cdk-lib/aws-s3-assets';
        import { aws_appsync } from 'aws-cdk-lib';
        import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'dev',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-dev' },
            },
          ],
          schema,
        });

        export function applyEscapeHatches(backend: Backend) {
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const resolversDir = join(__dirname, 'resolvers');
          const overiddenResolverFiles = readdirSync(resolversDir).filter(
            (f) =>
              (f.endsWith('.req.vtl') || f.endsWith('.res.vtl')) &&
              f.split('.').length === 4
          );
          for (const file of overiddenResolverFiles) {
            const [typeName, fieldName, templateType] = file.split('.');
            const capitalizedFieldName =
              fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            const functionId = \`\${typeName}\${capitalizedFieldName}DataResolverFn\`;
            const fn =
              backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
            const vtlTemplate = new assets.Asset(backend.data, \`VTLTemplate-\${file}\`, {
              path: join(resolversDir, file),
            });
            if (templateType === 'req') {
              fn.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            } else {
              fn.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
            }
          }
          // extending resolvers
          const noneDataSource =
            backend.data.resources.graphqlApi.addNoneDataSource('none');
          const MutationdeleteTodopreAuth1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationdeleteTodopreAuth1',
            {
              name: 'MutationdeleteTodopreAuth1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.deleteTodo.preAuth.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const MutationdeleteTodopostAuth1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationdeleteTodopostAuth1',
            {
              name: 'MutationdeleteTodopostAuth1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.deleteTodo.postAuth.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.deleteTodo.postAuth.1.res.vtl')
              ),
            }
          );
          const mutationDeleteTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.deleteTodo'] as CfnResolver;
          const mutationDeleteTodoPipelineFunctions =
            (
              mutationDeleteTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationDeleteTodoPipelineFunctions.splice(
            0,
            0,
            MutationdeleteTodopreAuth1.functionId
          );
          mutationDeleteTodoPipelineFunctions.splice(
            3,
            0,
            MutationdeleteTodopostAuth1.functionId
          );
          mutationDeleteTodoResolver.pipelineConfig = {
            functions: mutationDeleteTodoPipelineFunctions,
          };
          const MutationupdateTodopreUpdate1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationupdateTodopreUpdate1',
            {
              name: 'MutationupdateTodopreUpdate1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.updateTodo.preUpdate.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.updateTodo.preUpdate.1.res.vtl')
              ),
            }
          );
          const mutationUpdateTodoResolver = backend.data.resources.cfnResources
            .cfnResolvers['Mutation.updateTodo'] as CfnResolver;
          const mutationUpdateTodoPipelineFunctions =
            (
              mutationUpdateTodoResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
            ).functions || [];
          mutationUpdateTodoPipelineFunctions.splice(
            3,
            0,
            MutationupdateTodopreUpdate1.functionId
          );
          mutationUpdateTodoResolver.pipelineConfig = {
            functions: mutationUpdateTodoPipelineFunctions,
          };
        }
        "
      `);
    });
  });
});
