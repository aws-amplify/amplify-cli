import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { GraphqlApi } from '@aws-sdk/client-appsync';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
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
export class DataGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly defineData: DataRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resource: DiscoveredResource) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.defineData = new DataRenderer(gen1App.envName);
  }

  /**
   * Plans the GraphQL data generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const apiName = this.gen1App.singleResourceName('api', 'AppSync');
    const schema = this.gen1App.file(path.join('api', apiName, 'schema.graphql'));
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
    const vtlFiles = findResolverVtlFiles(apiName);

    const operations: AmplifyMigrationOperation[] = [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/data/resource.ts'],
        execute: async () => {
          const nodes = this.defineData.render({
            schema,
            tableMappings,
            authorizationModes,
            logging,
          });

          const content = TS.printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addImport('./data/resource', ['data']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('data')));

          // Add additional auth providers override to backend.ts
          if (additionalAuthProviders && additionalAuthProviders.length > 0 && hasAuth) {
            this.contributeAdditionalAuthProviders(additionalAuthProviders);
          }

          if (vtlFiles.length > 0) {
            this.contributeResolverOverrides();
          }
        },
      },
    ];

    if (vtlFiles.length > 0) {
      operations.push(this.createCopyResolversOperation(apiName, vtlFiles));
    }

    return operations;
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
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              'awsRegion',
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
                  factory.createIdentifier('stack'),
                ),
                factory.createIdentifier('region'),
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

  /**
   * Creates an operation that copies VTL resolver files from the Gen1
   * local project to the Gen2 output directory.
   */
  private createCopyResolversOperation(apiName: string, vtlFiles: readonly string[]): AmplifyMigrationOperation {
    const sourceDir = path.join(process.cwd(), 'amplify', 'backend', 'api', apiName, 'resolvers');
    const destDir = path.join(this.outputDir, 'amplify', 'data', 'resolvers');

    return {
      resource: this.resource,
      validate: () => undefined,
      describe: async () => [`Copy ${vtlFiles.length} VTL resolver file(s) to amplify/data/resolvers/`],
      execute: async () => {
        await fs.mkdir(destDir, { recursive: true });
        for (const file of vtlFiles) {
          await fs.copyFile(path.join(sourceDir, file), path.join(destDir, file));
        }
      },
    };
  }

  /**
   * Contributes resolver override statements to backend.ts.
   *
   * Generates code that reads VTL files from `data/resolvers/` at runtime
   * and overrides the pipeline function response mapping templates, replacing
   * the S3-based templates with inline content.
   */
  private contributeResolverOverrides(): void {
    // Imports for the generated backend.ts file
    this.backendGenerator.addImport('fs', ['readFileSync', 'readdirSync']);
    this.backendGenerator.addImport('path', ['join', 'dirname']);
    this.backendGenerator.addImport('url', ['fileURLToPath']);

    // const __dirname = dirname(fileURLToPath(import.meta.url));
    this.backendGenerator.addStatement(
      TS.constDecl(
        '__dirname',
        factory.createCallExpression(factory.createIdentifier('dirname'), undefined, [
          factory.createCallExpression(factory.createIdentifier('fileURLToPath'), undefined, [
            factory.createPropertyAccessExpression(
              factory.createMetaProperty(ts.SyntaxKind.ImportKeyword, factory.createIdentifier('meta')),
              factory.createIdentifier('url'),
            ),
          ]),
        ]),
      ),
    );

    // const resolversDir = join(__dirname, "data/resolvers");
    this.backendGenerator.addStatement(
      TS.constDecl(
        'resolversDir',
        factory.createCallExpression(factory.createIdentifier('join'), undefined, [
          factory.createIdentifier('__dirname'),
          factory.createStringLiteral('data/resolvers'),
        ]),
      ),
    );

    // const resolverFiles = readdirSync(resolversDir).filter(f => f.endsWith(".req.vtl") || f.endsWith(".res.vtl"));
    this.backendGenerator.addStatement(
      TS.constDecl(
        'resolverFiles',
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createCallExpression(factory.createIdentifier('readdirSync'), undefined, [factory.createIdentifier('resolversDir')]),
            factory.createIdentifier('filter'),
          ),
          undefined,
          [
            factory.createArrowFunction(
              undefined,
              undefined,
              [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('f'))],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createBinaryExpression(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('f'), factory.createIdentifier('endsWith')),
                  undefined,
                  [factory.createStringLiteral('.req.vtl')],
                ),
                factory.createToken(ts.SyntaxKind.BarBarToken),
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('f'), factory.createIdentifier('endsWith')),
                  undefined,
                  [factory.createStringLiteral('.res.vtl')],
                ),
              ),
            ),
          ],
        ),
      ),
    );

    // for (const file of resolverFiles) { ... }
    this.backendGenerator.addStatement(this.buildResolverForOfLoop());
  }

  /**
   * Builds the for-of loop that processes each resolver file.
   *
   * Generates:
   * ```ts
   * for (const file of resolverFiles) {
   *   const parts = file.replace(".req.vtl", "").replace(".res.vtl", "").split(".");
   *   const [typeName, fieldName] = parts;
   *   const isRequest = file.endsWith(".req.vtl");
   *   const functionId = `${typeName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}DataResolverFn`;
   *   const pipelineFunction = backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
   *   if (pipelineFunction) {
   *     const template = readFileSync(join(resolversDir, file), "utf8");
   *     if (isRequest) {
   *       pipelineFunction.requestMappingTemplateS3Location = undefined;
   *       pipelineFunction.requestMappingTemplate = template;
   *     } else {
   *       pipelineFunction.responseMappingTemplateS3Location = undefined;
   *       pipelineFunction.responseMappingTemplate = template;
   *     }
   *   }
   * }
   * ```
   */
  private buildResolverForOfLoop(): ts.ForOfStatement {
    // const parts = file.replace(".req.vtl", "").replace(".res.vtl", "").split(".");
    const partsStatement = TS.constDecl(
      'parts',
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('file'), factory.createIdentifier('replace')),
                undefined,
                [factory.createStringLiteral('.req.vtl'), factory.createStringLiteral('')],
              ),
              factory.createIdentifier('replace'),
            ),
            undefined,
            [factory.createStringLiteral('.res.vtl'), factory.createStringLiteral('')],
          ),
          factory.createIdentifier('split'),
        ),
        undefined,
        [factory.createStringLiteral('.')],
      ),
    );

    // const [typeName, fieldName] = parts;
    const destructureStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createArrayBindingPattern([
              factory.createBindingElement(undefined, undefined, 'typeName'),
              factory.createBindingElement(undefined, undefined, 'fieldName'),
            ]),
            undefined,
            undefined,
            factory.createIdentifier('parts'),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

    // const isRequest = file.endsWith(".req.vtl");
    const isRequestStatement = TS.constDecl(
      'isRequest',
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('file'), factory.createIdentifier('endsWith')),
        undefined,
        [factory.createStringLiteral('.req.vtl')],
      ),
    );

    // const functionId = `${typeName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}DataResolverFn`;
    const functionIdStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'functionId',
            undefined,
            undefined,
            factory.createTemplateExpression(factory.createTemplateHead(''), [
              factory.createTemplateSpan(factory.createIdentifier('typeName'), factory.createTemplateMiddle('')),
              factory.createTemplateSpan(
                factory.createBinaryExpression(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createCallExpression(
                        factory.createPropertyAccessExpression(factory.createIdentifier('fieldName'), factory.createIdentifier('charAt')),
                        undefined,
                        [factory.createNumericLiteral('0')],
                      ),
                      factory.createIdentifier('toUpperCase'),
                    ),
                    undefined,
                    [],
                  ),
                  factory.createToken(ts.SyntaxKind.PlusToken),
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('fieldName'), factory.createIdentifier('slice')),
                    undefined,
                    [factory.createNumericLiteral('1')],
                  ),
                ),
                factory.createTemplateTail('DataResolverFn'),
              ),
            ]),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

    // const pipelineFunction = backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
    const pipelineFunctionStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'pipelineFunction',
            undefined,
            undefined,
            factory.createElementAccessExpression(
              TS.propAccess('backend', 'data', 'resources', 'cfnResources', 'cfnFunctionConfigurations'),
              factory.createIdentifier('functionId'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

    // if (pipelineFunction) { ... }
    const ifStatement = factory.createIfStatement(
      factory.createIdentifier('pipelineFunction'),
      factory.createBlock(
        [
          // const template = readFileSync(join(resolversDir, file), "utf8");
          TS.constDecl(
            'template',
            factory.createCallExpression(factory.createIdentifier('readFileSync'), undefined, [
              factory.createCallExpression(factory.createIdentifier('join'), undefined, [
                factory.createIdentifier('resolversDir'),
                factory.createIdentifier('file'),
              ]),
              factory.createStringLiteral('utf8'),
            ]),
          ),
          // if (isRequest) { ... } else { ... }
          factory.createIfStatement(
            factory.createIdentifier('isRequest'),
            factory.createBlock(
              [
                factory.createExpressionStatement(
                  factory.createAssignment(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('pipelineFunction'),
                      factory.createIdentifier('requestMappingTemplateS3Location'),
                    ),
                    factory.createIdentifier('undefined'),
                  ),
                ),
                factory.createExpressionStatement(
                  factory.createAssignment(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('pipelineFunction'),
                      factory.createIdentifier('requestMappingTemplate'),
                    ),
                    factory.createIdentifier('template'),
                  ),
                ),
              ],
              true,
            ),
            factory.createBlock(
              [
                factory.createExpressionStatement(
                  factory.createAssignment(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('pipelineFunction'),
                      factory.createIdentifier('responseMappingTemplateS3Location'),
                    ),
                    factory.createIdentifier('undefined'),
                  ),
                ),
                factory.createExpressionStatement(
                  factory.createAssignment(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('pipelineFunction'),
                      factory.createIdentifier('responseMappingTemplate'),
                    ),
                    factory.createIdentifier('template'),
                  ),
                ),
              ],
              true,
            ),
          ),
        ],
        true,
      ),
    );

    return factory.createForOfStatement(
      undefined,
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration('file', undefined, undefined, undefined)],
        ts.NodeFlags.Const,
      ),
      factory.createIdentifier('resolverFiles'),
      factory.createBlock(
        [partsStatement, destructureStatement, isRequestStatement, functionIdStatement, pipelineFunctionStatement, ifStatement],
        true,
      ),
    );
  }
}

/**
 * Finds VTL resolver files in the local Gen1 project's resolvers directory.
 * Returns an empty array if the directory doesn't exist or has no VTL files.
 */
function findResolverVtlFiles(apiName: string): readonly string[] {
  const resolversPath = path.join(process.cwd(), 'amplify', 'backend', 'api', apiName, 'resolvers');
  if (!existsSync(resolversPath)) return [];
  return readdirSync(resolversPath).filter((file) => file.endsWith('.vtl'));
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
