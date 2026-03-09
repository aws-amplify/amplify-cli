import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { GetGraphqlApiCommand } from '@aws-sdk/client-appsync';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';
import { generateDataSource } from './render-data';
import { readGraphQLSchema } from './graphql-schema-reader';
import { readRestApis } from './rest-api-reader';
import type { RestApiDefinition } from './rest-api-reader';

const factory = ts.factory;

/**
 * Generates data (GraphQL/REST API) resource files and contributes to backend.ts.
 *
 * Reads the Gen1 API configuration (AppSync schema, REST API paths,
 * authorization modes) and generates amplify/data/resource.ts with a
 * defineData() call. Also contributes the data import to backend.ts.
 */
export class DataGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
  }

  /**
   * Plans the data generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const apiCategory = await this.gen1App.fetchMetaCategory('api');
    if (!apiCategory) {
      return [];
    }

    const graphQLApiEntry = Object.entries(apiCategory).find(([, value]) => (value as Record<string, unknown>).service === 'AppSync');

    const restApis = await readRestApis(apiCategory);
    const hasGraphQL = graphQLApiEntry !== undefined;

    if (!hasGraphQL && restApis.length === 0) {
      return [];
    }

    // For GraphQL APIs, read schema and fetch auth/logging config from AppSync
    let schema: string | undefined;
    let authorizationModes: unknown | undefined;
    let logging: unknown | undefined;

    if (hasGraphQL) {
      const [apiName, apiMeta] = graphQLApiEntry;
      schema = await readGraphQLSchema(apiName);

      const output = (apiMeta as Record<string, unknown>).output as Record<string, unknown> | undefined;
      authorizationModes = output?.authConfig;
      const apiId = output?.GraphQLAPIIdOutput as string | undefined;

      if (apiId) {
        const appSyncResponse = await this.gen1App.clients.appSync.send(new GetGraphqlApiCommand({ apiId }));

        // Merge additional auth providers from the live API
        if (appSyncResponse.graphqlApi?.additionalAuthenticationProviders?.length) {
          const additionalProviders = appSyncResponse.graphqlApi.additionalAuthenticationProviders.map((provider) => ({
            authenticationType: provider.authenticationType,
            ...(provider.lambdaAuthorizerConfig && { lambdaAuthorizerConfig: provider.lambdaAuthorizerConfig }),
            ...(provider.openIDConnectConfig && { openIdConnectConfig: provider.openIDConnectConfig }),
            ...(provider.userPoolConfig && { userPoolConfig: provider.userPoolConfig }),
          }));

          // Append to the auth config's additionalAuthenticationProviders
          if (authorizationModes && typeof authorizationModes === 'object') {
            (authorizationModes as Record<string, unknown>).additionalAuthenticationProviders = additionalProviders;
          }
        }

        // Fetch logging config
        const logConfig = appSyncResponse.graphqlApi?.logConfig;
        if (logConfig?.fieldLogLevel && logConfig.fieldLogLevel !== 'NONE') {
          logging = {
            fieldLogLevel: logConfig.fieldLogLevel.toLowerCase(),
            ...(logConfig.excludeVerboseContent !== undefined && {
              excludeVerboseContent: logConfig.excludeVerboseContent,
            }),
          };
        }
      }
    }

    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const envName = this.gen1App.envName;
    const operations: AmplifyMigrationOperation[] = [];

    // GraphQL data resource generation
    if (schema) {
      operations.push({
        describe: async () => ['Generate data/resource.ts'],
        execute: async () => {
          const nodes = await generateDataSource({
            envName,
            schema,
            authorizationModes: authorizationModes as import('@aws-amplify/backend-data').AuthorizationModes | undefined,
            logging: logging as import('@aws-amplify/backend-data').DataLoggingOptions | undefined,
          });
          if (!nodes) return;

          const content = printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          const dataIdentifier = factory.createIdentifier('data');
          this.backendGenerator.addImport('./data/resource', ['data']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(dataIdentifier));
        },
      });
    }

    // REST API operations are tracked for backend.ts contributions
    // but the actual REST API resource generation is handled separately
    // since REST APIs map to functions, not defineData().
    if (restApis.length > 0) {
      operations.push(...this.planRestApiOperations(restApis));
    }

    return operations;
  }

  /**
   * Plans operations for REST API resources.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private planRestApiOperations(_restApis: RestApiDefinition[]): AmplifyMigrationOperation[] {
    // REST APIs are tracked but their resource generation is a separate concern
    // that involves function generators. This is a placeholder for the REST API
    // contribution to backend.ts if needed.
    return [];
  }
}
