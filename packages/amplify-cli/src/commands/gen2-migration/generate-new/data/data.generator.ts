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

const factory = ts.factory;

/**
 * Generates the AppSync/GraphQL data resource and contributes to backend.ts.
 *
 * Reads the Gen1 AppSync configuration (schema, authorization modes,
 * logging) and generates amplify/data/resource.ts with a defineData() call.
 *
 * REST APIs are handled by a separate RestApiGenerator.
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
   * Plans the GraphQL data generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const apiCategory = await this.gen1App.fetchMetaCategory('api');
    if (!apiCategory) {
      return [];
    }

    const graphQLApiEntry = Object.entries(apiCategory).find(([, value]) => (value as Record<string, unknown>).service === 'AppSync');
    if (!graphQLApiEntry) {
      return [];
    }

    const [apiName, apiMeta] = graphQLApiEntry;
    const schema = await this.gen1App.fetchGraphQLSchema(apiName);

    const output = (apiMeta as Record<string, unknown>).output as Record<string, unknown> | undefined;
    const authorizationModes = output?.authConfig;
    const apiId = output?.GraphQLAPIIdOutput as string | undefined;

    let logging: unknown | undefined;

    if (apiId) {
      const appSyncResponse = await this.gen1App.clients.appSync.send(new GetGraphqlApiCommand({ apiId }));

      if (appSyncResponse.graphqlApi?.additionalAuthenticationProviders?.length) {
        const additionalProviders = appSyncResponse.graphqlApi.additionalAuthenticationProviders.map((provider) => ({
          authenticationType: provider.authenticationType,
          ...(provider.lambdaAuthorizerConfig && { lambdaAuthorizerConfig: provider.lambdaAuthorizerConfig }),
          ...(provider.openIDConnectConfig && { openIdConnectConfig: provider.openIDConnectConfig }),
          ...(provider.userPoolConfig && { userPoolConfig: provider.userPoolConfig }),
        }));

        if (authorizationModes && typeof authorizationModes === 'object') {
          (authorizationModes as Record<string, unknown>).additionalAuthenticationProviders = additionalProviders;
        }
      }

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

    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const envName = this.gen1App.envName;

    return [
      {
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

          this.backendGenerator.addImport('./data/resource', ['data']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('data')));
        },
      },
    ];
  }
}
