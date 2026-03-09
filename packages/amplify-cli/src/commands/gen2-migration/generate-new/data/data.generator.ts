import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { GetGraphqlApiCommand, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';
import { renderDefineData, DataTableMapping } from './render-data';

const factory = ts.factory;

/**
 * Generates the AppSync/GraphQL data resource and contributes to backend.ts.
 *
 * Reads the Gen1 AppSync configuration (schema, authorization modes,
 * logging), resolves DynamoDB table mappings, and generates
 * amplify/data/resource.ts with a defineData() call.
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

    // Resolve table mappings — this requires an AWS call to find the API ID
    const tableMappings = await this.resolveTableMappings(schema, apiId);

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
          const nodes = renderDefineData({
            envName,
            schema,
            tableMappings,
            authorizationModes: authorizationModes as import('@aws-amplify/backend-data').AuthorizationModes | undefined,
            logging: logging as import('@aws-amplify/backend-data').DataLoggingOptions | undefined,
          });

          const content = printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addImport('./data/resource', ['data']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('data')));
        },
      },
    ];
  }

  /**
   * Resolves DynamoDB table mappings for the GraphQL schema.
   * If the API ID is known from amplify-meta.json output, uses it directly.
   * Otherwise, queries AppSync to find the API by environment tags.
   */
  private async resolveTableMappings(schema: string, apiIdFromMeta?: string): Promise<DataTableMapping> {
    const envName = this.gen1App.envName;
    const resolvedApiId = apiIdFromMeta ?? (await this.findAppSyncApiId(envName));
    if (!resolvedApiId) {
      throw new Error(`Unable to find AppSync API for environment '${envName}'. Ensure the API exists and is properly tagged.`);
    }
    return createTableMappings(schema, resolvedApiId, envName);
  }

  /**
   * Finds the AppSync API ID by scanning all APIs for matching environment tags.
   */
  private async findAppSyncApiId(envName: string): Promise<string | undefined> {
    const client = this.gen1App.clients.appSync;
    const projectName = this.getProjectName();

    for await (const page of paginateListGraphqlApis({ client }, {})) {
      for (const api of page.graphqlApis ?? []) {
        const matchesEnv = api.tags?.['user:Stack'] === envName;
        const matchesProject = projectName ? api.tags?.['user:Application'] === projectName : true;
        if (matchesEnv && matchesProject) {
          return api.apiId;
        }
      }
    }
    return undefined;
  }

  private getProjectName(): string | undefined {
    try {
      const rootDir = pathManager.findProjectRoot();
      if (!rootDir) return undefined;
      const projectConfigPath = path.join(rootDir, 'amplify', '.config', 'project-config.json');
      const fsSync = require('fs');
      if (fsSync.existsSync(projectConfigPath)) {
        return JSON.parse(fsSync.readFileSync(projectConfigPath, 'utf8')).projectName;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}

function createTableMappings(schema: string, apiId: string, envName: string): DataTableMapping {
  const modelRegex = /type\s+(\w+)\s+@model/g;
  const mapping: DataTableMapping = {};
  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    mapping[match[1]] = [match[1], apiId, envName].join('-');
  }
  return mapping;
}
