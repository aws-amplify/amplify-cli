import { GraphqlApi } from '@aws-sdk/client-appsync';
import {
  DataRenderer,
  DataRenderOptions,
  groupExtendedResolverFiles,
  computeSpliceIndexes,
  PIPELINE_3_SLOT_MAP,
  PIPELINE_4_SLOT_MAP,
  ExtendedResolverFile,
} from '../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer';
import {
  ClassifiedVtlFiles,
  classifyVtlFiles,
  ParsedExtended,
} from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
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

describe('groupExtendedResolverFiles', () => {
  const makeExtended = (typeName: string, fieldName: string, slot: string, order: number, templateType: 'req' | 'res'): ParsedExtended => ({
    kind: 'extended',
    typeName,
    fieldName,
    slot,
    order,
    templateType,
    filename: `${typeName}.${fieldName}.${slot}.${order}.${templateType}.vtl`,
  });

  it('groups entries by typeName.fieldName', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Query', 'listItems', 'postAuth', 1, 'req'),
    ];
    const result = groupExtendedResolverFiles(entries);
    expect(result.size).toBe(2);
    expect(result.has('Mutation.createTodo')).toBe(true);
    expect(result.has('Query.listItems')).toBe(true);
  });

  it('sorts within group by slot pipeline execution order', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'finish', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'auth', 1, 'req'),
    ];
    const result = groupExtendedResolverFiles(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups.map((g) => g.slot)).toEqual(['init', 'auth', 'finish']);
  });

  it('sorts within same slot by numeric order', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'init', 3, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 2, 'req'),
    ];
    const result = groupExtendedResolverFiles(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups.map((g) => g.order)).toEqual([1, 2, 3]);
  });

  it('pairs req and res templates for same slot+order', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 1, 'res'),
    ];
    const result = groupExtendedResolverFiles(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups).toHaveLength(1);
    expect(groups[0].reqFile).toBe('Mutation.createTodo.init.1.req.vtl');
    expect(groups[0].resFile).toBe('Mutation.createTodo.init.1.res.vtl');
  });

  it('handles entry with only req file (no res)', () => {
    const entries: ParsedExtended[] = [makeExtended('Mutation', 'createTodo', 'init', 1, 'req')];
    const result = groupExtendedResolverFiles(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups).toHaveLength(1);
    expect(groups[0].reqFile).toBe('Mutation.createTodo.init.1.req.vtl');
    expect(groups[0].resFile).toBeUndefined();
  });

  it('handles entry with only res file (no req)', () => {
    const entries: ParsedExtended[] = [makeExtended('Mutation', 'createTodo', 'init', 1, 'res')];
    const result = groupExtendedResolverFiles(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups).toHaveLength(1);
    expect(groups[0].reqFile).toBeUndefined();
    expect(groups[0].resFile).toBe('Mutation.createTodo.init.1.res.vtl');
  });
});

describe('computeSpliceIndexes', () => {
  const makeResolverFile = (slot: string, order: number): ExtendedResolverFile => ({
    typeName: 'Mutation',
    fieldName: 'createTodo',
    slot,
    order,
  });

  it('uses 3-function pipeline for Query', () => {
    const resolverFiles: ExtendedResolverFile[] = [{ typeName: 'Query', fieldName: 'getTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Query', 'getTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_3_SLOT_MAP['init']);
  });

  it('uses 3-function pipeline for Subscription', () => {
    const resolverFiles: ExtendedResolverFile[] = [{ typeName: 'Subscription', fieldName: 'onCreateTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Subscription', 'onCreateTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_3_SLOT_MAP['init']);
  });

  it('uses 3-function pipeline for delete Mutation (fieldName starts with "delete")', () => {
    const resolverFiles: ExtendedResolverFile[] = [{ typeName: 'Mutation', fieldName: 'deleteTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Mutation', 'deleteTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_3_SLOT_MAP['init']);
  });

  it('uses 4-function pipeline for create Mutation', () => {
    const resolverFiles: ExtendedResolverFile[] = [{ typeName: 'Mutation', fieldName: 'createTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Mutation', 'createTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['init']);
  });

  it('uses 4-function pipeline for update Mutation', () => {
    const resolverFiles: ExtendedResolverFile[] = [{ typeName: 'Mutation', fieldName: 'updateTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Mutation', 'updateTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['init']);
  });

  it('computes correct splice index with running offset for multiple entries', () => {
    const resolverFiles: ExtendedResolverFile[] = [makeResolverFile('init', 1), makeResolverFile('auth', 1), makeResolverFile('finish', 1)];
    const result = computeSpliceIndexes('Mutation', 'createTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['init'] + 0);
    expect(result.entries[1].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['auth'] + 1);
    expect(result.entries[2].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['finish'] + 2);
  });

  it('computes init.2 and finish.1 on create mutation correctly', () => {
    const resolverFiles: ExtendedResolverFile[] = [makeResolverFile('init', 2), makeResolverFile('finish', 1)];
    const result = computeSpliceIndexes('Mutation', 'createTodo', resolverFiles);
    expect(result.entries[0].spliceIndex).toBe(1);
    expect(result.entries[1].spliceIndex).toBe(5);
  });
});

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
    // 4-function pipeline (create/update Mutation): [init0, auth0, postAuth0, DataResolverFn]
    // preUpdate maps to index 3 → splice inserts before DataResolverFn
    // Final pipeline: [init0, auth0, postAuth0, preUpdate1, DataResolverFn]
    it('generates AppsyncFunction + splice for a single extended resolver (preUpdate slot on create Mutation)', () => {
      const classified = classifyVtlFiles(['Mutation.createTodo.preUpdate.1.req.vtl']);

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
          const MutationcreateTodopreUpdate1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodopreUpdate1',
            {
              name: 'MutationcreateTodopreUpdate1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.preUpdate.1.req.vtl')
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
            3,
            0,
            MutationcreateTodopreUpdate1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    // 4-function pipeline (create Mutation): [init0, auth0, postAuth0, DataResolverFn]
    // auth maps to index 2, postUpdate maps to index 4 (+ running offset 1 = 5)
    // Final pipeline: [init0, auth0, auth1, postAuth0, DataResolverFn, postUpdate1]
    it('generates multiple AppsyncFunctions + splices for auth and postUpdate slots on create Mutation', () => {
      const classified = classifyVtlFiles(['Mutation.createTodo.auth.1.req.vtl', 'Mutation.createTodo.postUpdate.1.res.vtl']);

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
          const MutationcreateTodoauth1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodoauth1',
            {
              name: 'MutationcreateTodoauth1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.auth.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
                '$util.toJson($ctx.prev.result)'
              ),
            }
          );
          const MutationcreateTodopostUpdate1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'MutationcreateTodopostUpdate1',
            {
              name: 'MutationcreateTodopostUpdate1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate:
                aws_appsync.MappingTemplate.fromString('$util.toJson({})'),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Mutation.createTodo.postUpdate.1.res.vtl')
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
            2,
            0,
            MutationcreateTodoauth1.functionId
          );
          mutationCreateTodoPipelineFunctions.splice(
            5,
            0,
            MutationcreateTodopostUpdate1.functionId
          );
          mutationCreateTodoResolver.pipelineConfig = {
            functions: mutationCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    // 3-function pipeline (Query): [auth0, postAuth0, DataResolverFn]
    // postDataLoad maps to index 3 → splice inserts after DataResolverFn
    // Final pipeline: [auth0, postAuth0, DataResolverFn, postDataLoad1]
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

    // 3-function pipeline (Subscription): [auth0, postAuth0, DataResolverFn]
    // preSubscribe maps to index 2 → splice inserts before DataResolverFn
    // Final pipeline: [auth0, postAuth0, preSubscribe1, DataResolverFn]
    it('generates splice for Subscription resolver with preSubscribe slot (3-function pipeline)', () => {
      const classified = classifyVtlFiles([
        'Subscription.onCreateTodo.preSubscribe.1.req.vtl',
        'Subscription.onCreateTodo.preSubscribe.1.res.vtl',
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
          const SubscriptiononCreateTodopreSubscribe1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'SubscriptiononCreateTodopreSubscribe1',
            {
              name: 'SubscriptiononCreateTodopreSubscribe1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Subscription.onCreateTodo.preSubscribe.1.req.vtl')
              ),
              responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Subscription.onCreateTodo.preSubscribe.1.res.vtl')
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
            2,
            0,
            SubscriptiononCreateTodopreSubscribe1.functionId
          );
          subscriptionOnCreateTodoResolver.pipelineConfig = {
            functions: subscriptionOnCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });
  });

  describe('mixed override and extended resolvers', () => {
    // Overrides: Query.getTodo req+res (replaces the DataResolverFn's VTL at runtime)
    // Extended on 4-function pipeline (create Mutation): [init0, auth0, postAuth0, DataResolverFn]
    // init.2 maps to index 1, finish.1 maps to index 4 (+ running offset 1 = 5)
    // Final pipeline: [init0, init2, auth0, postAuth0, DataResolverFn, finish1]
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

    // Mutation.createTodo: 4-function pipeline [init0, auth0, postAuth0, DataResolverFn]
    //   init.1 maps to index 1 → Final: [init0, init1, auth0, postAuth0, DataResolverFn]
    // Subscription.onCreateTodo: 3-function pipeline [auth0, postAuth0, DataResolverFn]
    //   preSubscribe.1 maps to index 2 → Final: [auth0, postAuth0, preSubscribe1, DataResolverFn]
    it('generates extended resolvers across Mutation and Subscription fields', () => {
      const classified = classifyVtlFiles([
        'Mutation.createTodo.init.1.req.vtl',
        'Mutation.createTodo.init.1.res.vtl',
        'Subscription.onCreateTodo.preSubscribe.1.req.vtl',
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
          const SubscriptiononCreateTodopreSubscribe1 = new aws_appsync.AppsyncFunction(
            backend.data.stack,
            'SubscriptiononCreateTodopreSubscribe1',
            {
              name: 'SubscriptiononCreateTodopreSubscribe1',
              api: backend.data.resources.graphqlApi,
              dataSource: noneDataSource,
              requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
                join(resolversDir, 'Subscription.onCreateTodo.preSubscribe.1.req.vtl')
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
            2,
            0,
            SubscriptiononCreateTodopreSubscribe1.functionId
          );
          subscriptionOnCreateTodoResolver.pipelineConfig = {
            functions: subscriptionOnCreateTodoPipelineFunctions,
          };
        }
        "
      `);
    });

    // Overrides: Mutation.createTodo.req, Query.getTodo.res (replace DataResolverFn VTL at runtime)
    // Mutation.createTodo: 4-function pipeline [init0, auth0, postAuth0, DataResolverFn]
    //   init.1 at index 1, finish.1 at index 4+1=5 → Final: [init0, init1, auth0, postAuth0, DataResolverFn, finish1]
    // Query.listTodos: 3-function pipeline [auth0, postAuth0, DataResolverFn]
    //   postDataLoad.1 at index 3 → Final: [auth0, postAuth0, DataResolverFn, postDataLoad1]
    // Subscription.onCreateTodo: 3-function pipeline [auth0, postAuth0, DataResolverFn]
    //   preAuth.1 at index 0 → Final: [preAuth1, auth0, postAuth0, DataResolverFn]
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

    // Override: Mutation.deleteTodo.req (replaces DataResolverFn VTL at runtime)
    // Mutation.deleteTodo: 3-function pipeline [auth0, postAuth0, DataResolverFn]
    //   preAuth.1 at index 0, postAuth.1 at index 2+1=3 → Final: [preAuth1, auth0, postAuth0, postAuth1, DataResolverFn]
    // Mutation.updateTodo: 4-function pipeline [init0, auth0, postAuth0, DataResolverFn]
    //   preUpdate.1 at index 3 → Final: [init0, auth0, postAuth0, preUpdate1, DataResolverFn]
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
