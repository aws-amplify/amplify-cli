import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { globSync } from 'glob';
import { GraphqlApi } from '@aws-sdk/client-appsync';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { DataRenderer, LambdaAuthFunctionRef } from './data.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

// ── Resolver Utility Types ─────────────────────────────────────────────

/** Parsed 4-segment override VTL filename. */
export interface ParsedOverride {
  readonly kind: 'override';
  readonly typeName: string;
  readonly fieldName: string;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** Parsed 6-segment extended VTL filename. */
export interface ParsedExtended {
  readonly kind: 'extended';
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** Union of parsed VTL filename types. */
export type ParsedVtl = ParsedOverride | ParsedExtended;

/** Classification result from `classifyVtlFiles`. */
export interface ClassifiedVtlFiles {
  readonly overrides: readonly ParsedOverride[];
  readonly extended: readonly ParsedExtended[];
}

// ── Resolver Utility Functions ─────────────────────────────────────────

/**
 * Parses a single VTL filename into a structured representation.
 *
 * 4 segments → ParsedOverride, 6 segments → ParsedExtended, otherwise undefined.
 */
export function parseVtlFilename(filename: string): ParsedVtl | undefined {
  const segments = filename.split('.');
  if (segments.length === 4) {
    const [typeName, fieldName, templateType] = segments;
    return {
      kind: 'override',
      typeName,
      fieldName,
      templateType: templateType as 'req' | 'res',
      filename,
    };
  }
  if (segments.length === 6) {
    const [typeName, fieldName, slot, orderStr, templateType] = segments;
    return {
      kind: 'extended',
      typeName,
      fieldName,
      slot,
      order: Number(orderStr),
      templateType: templateType as 'req' | 'res',
      filename,
    };
  }
  return undefined;
}

/**
 * Classifies an array of VTL filenames into overrides and extended resolvers.
 *
 * Validates slots, checks for non-numeric order segments, and detects duplicates.
 */
export function classifyVtlFiles(filenames: string[]): ClassifiedVtlFiles {
  const overrides: ParsedOverride[] = [];
  const extended: ParsedExtended[] = [];
  const seen = new Map<string, string>();

  for (const filename of filenames) {
    const parsed = parseVtlFilename(filename);
    if (!parsed) continue;

    if (parsed.kind === 'override') {
      overrides.push(parsed);
    } else {
      // Validate the order segment is a non-negative integer.
      const segments = filename.split('.');
      const orderStr = segments[3];
      if (!/^\d+$/.test(orderStr)) {
        throw new Error(`Non-numeric order '${orderStr}' in extended resolver file '${filename}'`);
      }

      // Detect duplicates: same typeName+fieldName+slot+order+templateType.
      const key = `${parsed.typeName}.${parsed.fieldName}.${parsed.slot}.${parsed.order}.${parsed.templateType}`;
      const existing = seen.get(key);
      if (existing) {
        throw new Error(`Duplicate extended resolver: '${existing}' and '${filename}'`);
      }
      seen.set(key, filename);

      extended.push(parsed);
    }
  }

  return { overrides, extended };
}

// ── DataGenerator ──────────────────────────────────────────────────────

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
  private readonly logger: SpinningLogger;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    resource: DiscoveredResource,
    logger: SpinningLogger,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.renderer = new DataRenderer(gen1App.envName);
    this.logger = logger;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const schema = this.collectUserSchema();
    const apiId = this.gen1App.resourceMetaOutput(this.resource, 'GraphQLAPIIdOutput');

    const tableMappings = this.createTableMappings(apiId);

    this.logger.debug(`Fetching AppSync API '${apiId}'`);
    const graphqlApi = await this.gen1App.aws.fetchGraphqlApi(apiId);
    if (!graphqlApi) {
      throw new AmplifyError('AppSyncApiNotFoundError', {
        message: `AppSync API '${apiId}' not found`,
        resolution: 'Verify the AppSync API exists and the CLI has the correct AWS credentials and region configured.',
      });
    }

    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const hasAdditionalAuthProviders =
      graphqlApi.additionalAuthenticationProviders !== undefined && graphqlApi.additionalAuthenticationProviders.length > 0;
    const hasAuth = this.gen1App.categoryMeta('auth') !== undefined;
    const authorizationModes = supplementOidcConfig(this.gen1App.resourceMetaOutput(this.resource, 'authConfig'), graphqlApi);
    const lambdaAuthFunction = extractLambdaAuthFunction(authorizationModes);
    const hasIamAuth = this.detectIamAuth(authorizationModes, graphqlApi);
    const vtlFiles = this.findResolverVtlFiles(this.resource.resourceName);
    const hasResolvers = vtlFiles.length > 0;
    const classifiedResolvers = hasResolvers ? classifyVtlFiles([...vtlFiles]) : undefined;
    const needsEscapeHatches = hasAdditionalAuthProviders || (hasIamAuth && hasAuth) || hasResolvers;

    const operations: AmplifyMigrationOperation[] = [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/data/resource.ts'],
        execute: async () => {
          this.logger.info('Rendering data/resource.ts');
          const nodes = this.renderer.render({
            schema,
            tableMappings,
            authorizationModes,
            graphqlApi,
            hasAuth,
            apiId,
            classifiedResolvers,
            lambdaAuthFunction,
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

    if (hasResolvers) {
      const gen1ResolversDir = path.join(this.gen1App.ccbDir, 'api', this.resource.resourceName, 'resolvers');
      const destResolversDir = path.join(dataDir, 'resolvers');

      operations.push({
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Copy VTL resolver files to amplify/data/resolvers/'],
        execute: async () => {
          await fs.mkdir(destResolversDir, { recursive: true });
          for (const file of vtlFiles) {
            await fs.copyFile(path.join(gen1ResolversDir, file), path.join(destResolversDir, file));
          }
        },
      });
    }

    return operations;
  }

  private collectUserSchema(): string {
    const schemaFilePath = path.join('api', this.resource.resourceName, 'schema.graphql');
    if (this.gen1App.fileExists(schemaFilePath)) {
      return this.gen1App.file(schemaFilePath);
    }

    const schemaDirPath = path.join('api', this.resource.resourceName, 'schema');
    const fullDirPath = path.join(this.gen1App.ccbDir, schemaDirPath);
    const files = globSync('**/*.graphql', { cwd: fullDirPath }).sort();
    return files.map((f) => this.gen1App.file(path.join(schemaDirPath, f))).join('\n');
  }

  /** Discovers VTL files in the Gen1 resolvers directory. */
  private findResolverVtlFiles(apiName: string): readonly string[] {
    const resolversDir = path.join(this.gen1App.ccbDir, 'api', apiName, 'resolvers');
    if (!existsSync(resolversDir)) {
      return [];
    }
    return readdirSync(resolversDir).filter((f) => f.endsWith('.vtl'));
  }

  /**
   * Extracts @model type names and maps each to its DynamoDB table
   * name ({ModelName}-{apiId}-{envName}).
   *
   * Reads the compiled build/schema.graphql where the Amplify
   * transformer expands each @model type into a `Model<Name>Connection`
   * type. This is more reliable than regex-matching `@model` in the
   * raw schema, which is sensitive to directive ordering.
   */
  private createTableMappings(apiId: string): Record<string, string> {
    const buildSchemaPath = path.join('api', this.resource.resourceName, 'build', 'schema.graphql');
    const buildSchema = this.gen1App.file(buildSchemaPath);
    const connectionRegex = /type\s+Model(\w+)Connection\b/g;
    const mapping: Record<string, string> = {};
    let match: RegExpExecArray | null;
    while ((match = connectionRegex.exec(buildSchema)) !== null) {
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

/**
 * Supplements the authConfig from amplify-meta.json with OIDC clientId
 * values from the live GraphQL API when they are missing in the local config.
 *
 * Gen1 amplify-meta.json may not include the `clientId` field for OIDC
 * providers (depends on CLI version), but the live API always has it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig from amplify-meta.json
function supplementOidcConfig(authConfig: any, graphqlApi: GraphqlApi): any {
  if (!authConfig) return authConfig;

  const result = JSON.parse(JSON.stringify(authConfig));

  if (
    result.defaultAuthentication?.authenticationType === 'OPENID_CONNECT' &&
    result.defaultAuthentication.openIDConnectConfig &&
    !result.defaultAuthentication.openIDConnectConfig.clientId &&
    graphqlApi.openIDConnectConfig?.clientId
  ) {
    result.defaultAuthentication.openIDConnectConfig.clientId = graphqlApi.openIDConnectConfig.clientId;
  }

  if (result.additionalAuthenticationProviders) {
    for (const provider of result.additionalAuthenticationProviders) {
      if (provider.authenticationType !== 'OPENID_CONNECT' || !provider.openIDConnectConfig || provider.openIDConnectConfig.clientId) {
        continue;
      }
      const match = graphqlApi.additionalAuthenticationProviders?.find(
        (p) => p.authenticationType === 'OPENID_CONNECT' && p.openIDConnectConfig?.issuer === provider.openIDConnectConfig.issuerUrl,
      );
      if (match?.openIDConnectConfig?.clientId) {
        provider.openIDConnectConfig.clientId = match.openIDConnectConfig.clientId;
      }
    }
  }

  return result;
}

/**
 * Extracts the Lambda authorizer function reference from the authConfig.
 * Searches both defaultAuthentication and additionalAuthenticationProviders.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig from amplify-meta.json
function extractLambdaAuthFunction(authorizationModes: any): LambdaAuthFunctionRef | undefined {
  if (!authorizationModes) return undefined;

  const lambdaFunctionName =
    findLambdaFunctionName(authorizationModes.defaultAuthentication) ??
    findLambdaFunctionNameInProviders(authorizationModes.additionalAuthenticationProviders);

  if (!lambdaFunctionName) return undefined;

  return {
    name: lambdaFunctionName,
    importPath: `../function/${lambdaFunctionName}/resource`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig provider
function findLambdaFunctionName(provider: any): string | undefined {
  if (provider?.authenticationType === 'AWS_LAMBDA' && provider.lambdaAuthorizerConfig?.lambdaFunction) {
    return provider.lambdaAuthorizerConfig.lambdaFunction;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig providers array
function findLambdaFunctionNameInProviders(providers: any[] | undefined): string | undefined {
  if (!providers) return undefined;
  // AppSync supports only one Lambda authorizer per API, but we iterate defensively
  // in case the config structure has multiple providers listed
  for (const provider of providers) {
    const name = findLambdaFunctionName(provider);
    if (name) return name;
  }
  return undefined;
}
