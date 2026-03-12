import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { GraphqlApi } from '@aws-sdk/client-appsync';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { DataRenderer, DataTableMapping } from './data.renderer';

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
  private readonly defineData: DataRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.defineData = new DataRenderer(gen1App.envName);
  }

  /**
   * Plans the GraphQL data generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const apiName = this.gen1App.singleResourceName('api', 'AppSync');
    const schema = this.gen1App.file(path.join('api', apiName, 'build', 'schema.graphql'));
    const apiId = this.gen1App.metaOutput('api', apiName, 'GraphQLAPIIdOutput');

    const tableMappings = createTableMappings(schema, apiId, this.gen1App.envName);

    const graphqlApi = await this.gen1App.aws.fetchGraphqlApi(apiId);
    if (!graphqlApi) {
      throw new Error(`AppSync API '${apiId}' not found`);
    }

    const authorizationModes = this.gen1App.metaOutput('api', apiName, 'authConfig');
    const additionalAuthProviders = graphqlApi.additionalAuthenticationProviders?.map((provider) => ({
      authenticationType: provider.authenticationType,
      ...(provider.lambdaAuthorizerConfig && { lambdaAuthorizerConfig: provider.lambdaAuthorizerConfig }),
      ...(provider.openIDConnectConfig && { openIdConnectConfig: provider.openIDConnectConfig }),
      ...(provider.userPoolConfig && { userPoolConfig: provider.userPoolConfig }),
    }));

    const logging = extractLoggingConfig(graphqlApi);
    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const hasAuth = this.gen1App.meta('auth') !== undefined;

    return [
      {
        describe: async () => ['Generate amplify/data/resource.ts'],
        execute: async () => {
          const nodes = this.defineData.render({
            schema,
            tableMappings,
            authorizationModes,
            logging,
          });

          const content = printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addImport('./data/resource', ['data']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('data')));

          // Add additional auth providers override to backend.ts
          if (additionalAuthProviders && additionalAuthProviders.length > 0 && hasAuth) {
            this.contributeAdditionalAuthProviders(additionalAuthProviders);
          }
        },
      },
    ];
  }

  /**
   * Contributes additional auth provider overrides to backend.ts.
   * Generates: `cfnGraphqlApi.additionalAuthenticationProviders = [...]`
   */
  private contributeAdditionalAuthProviders(providers: Array<Record<string, unknown>>): void {
    // const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
    const cfnGraphqlApiDecl = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'cfnGraphqlApi',
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
                  factory.createIdentifier('resources'),
                ),
                factory.createIdentifier('cfnResources'),
              ),
              factory.createIdentifier('cfnGraphqlApi'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    this.backendGenerator.addStatement(cfnGraphqlApiDecl);

    // cfnGraphqlApi.additionalAuthenticationProviders = [{ authenticationType: '...' }, ...]
    const providerElements = providers.map((provider) => {
      const props: ts.PropertyAssignment[] = [];
      if (provider.authenticationType) {
        props.push(
          factory.createPropertyAssignment('authenticationType', factory.createStringLiteral(provider.authenticationType as string)),
        );
      }
      if (provider.userPoolConfig) {
        const userPoolConfig = provider.userPoolConfig as Record<string, unknown>;
        const userPoolConfigProps: ts.PropertyAssignment[] = [];
        if (userPoolConfig.userPoolId) {
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              'userPoolId',
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
                    factory.createIdentifier('resources'),
                  ),
                  factory.createIdentifier('userPool'),
                ),
                factory.createIdentifier('userPoolId'),
              ),
            ),
          );
        }
        props.push(factory.createPropertyAssignment('userPoolConfig', factory.createObjectLiteralExpression(userPoolConfigProps, true)));
      }
      return factory.createObjectLiteralExpression(props, true);
    });

    const assignment = factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(
          factory.createIdentifier('cfnGraphqlApi'),
          factory.createIdentifier('additionalAuthenticationProviders'),
        ),
        factory.createArrayLiteralExpression(providerElements, true),
      ),
    );
    this.backendGenerator.addStatement(assignment);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from AppSync logConfig
function extractLoggingConfig(graphqlApi: GraphqlApi): any {
  const logConfig = graphqlApi.logConfig;
  if (!logConfig?.fieldLogLevel || logConfig.fieldLogLevel === 'NONE') {
    return undefined;
  }
  return {
    fieldLogLevel: logConfig.fieldLogLevel.toLowerCase(),
    ...(logConfig.excludeVerboseContent !== undefined && {
      excludeVerboseContent: logConfig.excludeVerboseContent,
    }),
  };
}

function createTableMappings(schema: string, apiId: string, envName: string): DataTableMapping {
  const modelRegex = /type\s+(\w+)\s+@model/g;
  const mapping: DataTableMapping = {};
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema)) !== null) {
    mapping[match[1]] = [match[1], apiId, envName].join('-');
  }
  return mapping;
}
