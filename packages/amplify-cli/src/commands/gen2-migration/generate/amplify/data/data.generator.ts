import path from 'node:path';
import fs from 'node:fs/promises';
import { GraphqlApi } from '@aws-sdk/client-appsync';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { DataRenderer } from './data.renderer';

/**
 * Generates the AppSync/GraphQL data resource and contributes to backend.ts.
 *
 * Reads the Gen1 AppSync configuration (schema, authorization modes,
 * logging), resolves DynamoDB table mappings, and generates
 * amplify/data/resource.ts with a defineData() call.
 *
 * REST APIs are handled by a separate RestApiGenerator.
 */
export class DataGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly renderer: DataRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resource: DiscoveredResource) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.renderer = new DataRenderer(gen1App.envName);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const schema = this.gen1App.file(path.join('api', this.resource.resourceName, 'schema.graphql'));
    const apiId = this.gen1App.resourceMetaOutput(this.resource, 'GraphQLAPIIdOutput');

    const tableMappings = this.createTableMappings(schema, apiId);

    const graphqlApi = await this.gen1App.aws.fetchGraphqlApi(apiId);
    if (!graphqlApi) {
      throw new Error(`AppSync API '${apiId}' not found`);
    }

    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const hasAdditionalAuthProviders =
      graphqlApi.additionalAuthenticationProviders !== undefined && graphqlApi.additionalAuthenticationProviders.length > 0;
    const hasAuth = this.gen1App.categoryMeta('auth') !== undefined;
    const authorizationModes = this.gen1App.resourceMetaOutput(this.resource, 'authConfig');
    const hasIamAuth = this.detectIamAuth(authorizationModes, graphqlApi);
    const needsEscapeHatches = hasAdditionalAuthProviders || (hasIamAuth && hasAuth);

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/data/resource.ts'],
        execute: async () => {
          const nodes = this.renderer.render({
            schema,
            tableMappings,
            authorizationModes,
            graphqlApi,
            hasAuth,
            apiId,
          });

          const content = TS.printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('data', './data/resource');
          this.backendGenerator.addDefineBackendEntry('data', 'data', 'data');
          if (needsEscapeHatches) {
            this.backendGenerator.addApplyEscapeHatchesCall({ alias: 'data', extraArgs: [] });
          }
        },
      },
    ];
  }

  /**
   * Extracts @model type names and maps each to its DynamoDB table
   * name ({ModelName}-{apiId}-{envName}).
   *
   * Reads the compiled build/schema.graphql where the Amplify
   * transformer expands each @model type into a `Model<Name>Connection`
   * type. This is more reliable than regex-matching `@model` in the
   * raw schema, which is sensitive to directive ordering.
   *
   * Falls back to the raw schema regex when build/schema.graphql is
   * absent.
   */
  private createTableMappings(schema: string, apiId: string): Record<string, string> {
    const buildSchemaPath = path.join('api', this.resource.resourceName, 'build', 'schema.graphql');
    if (this.gen1App.fileExists(buildSchemaPath)) {
      const buildSchema = this.gen1App.file(buildSchemaPath);
      const connectionRegex = /type\s+Model(\w+)Connection\b/g;
      const mapping: Record<string, string> = {};
      let match: RegExpExecArray | null;
      while ((match = connectionRegex.exec(buildSchema)) !== null) {
        mapping[match[1]] = [match[1], apiId, this.gen1App.envName].join('-');
      }
      return mapping;
    }
    const modelRegex = /type\s+(\w+)\s+@model/g;
    const mapping: Record<string, string> = {};
    let match: RegExpExecArray | null;
    while ((match = modelRegex.exec(schema)) !== null) {
      mapping[match[1]] = [match[1], apiId, this.gen1App.envName].join('-');
    }
    return mapping;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig from amplify-meta.json
  private detectIamAuth(authorizationModes: any, graphqlApi: GraphqlApi): boolean {
    const defaultAuthType = authorizationModes?.defaultAuthentication?.authenticationType;
    if (defaultAuthType === 'AWS_IAM') return true;
    return graphqlApi.additionalAuthenticationProviders?.some((p) => p.authenticationType === 'AWS_IAM') ?? false;
  }
}
