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
import { DataRenderer, DataTableMapping, ExtendedResolverFunctionEntry } from './data.renderer';

const factory = ts.factory;

/** Valid pipeline resolver slots in execution order. */
export const VALID_SLOTS = [
  'init',
  'preAuth',
  'auth',
  'postAuth',
  'preDataLoad',
  'postDataLoad',
  'preUpdate',
  'postUpdate',
  'finish',
] as const;

/** A named position within a pipeline resolver. */
export type Slot = (typeof VALID_SLOTS)[number];

/** Base insertion index for each slot relative to the default pipeline [auth0(0), postAuth0(1), DataResolverFn(2)]. */
export const SLOT_BASE_INDEX: Record<Slot, number> = {
  init: 0,
  preAuth: 0,
  auth: 1,
  postAuth: 2,
  preDataLoad: 2,
  postDataLoad: 3,
  preUpdate: 3,
  postUpdate: 3,
  finish: 3,
};

/** Parsed components of an extended resolver VTL filename. */
export interface ExtendedResolverDescriptor {
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: Slot;
  readonly order: number;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** A paired extended resolver function with request and/or response templates. */
export interface ExtendedResolverFunction {
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: Slot;
  readonly order: number;
  readonly requestFile: string | undefined;
  readonly responseFile: string | undefined;
}

/** Extended resolver functions grouped by pipeline resolver. */
export interface PipelineResolverGroup {
  readonly typeName: string;
  readonly fieldName: string;
  readonly functions: readonly ExtendedResolverFunction[];
}

/** VTL files classified as override or extended resolvers. */
export interface ClassifiedResolvers {
  readonly overrideFiles: readonly string[];
  readonly extendedDescriptors: readonly ExtendedResolverDescriptor[];
}

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
    const classified = vtlFiles.length > 0 ? classifyResolverFiles(vtlFiles) : { overrideFiles: [], extendedDescriptors: [] };

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

          // Grant the Gen2 authenticated user IAM role access to the Gen1 AppSync API
          if (hasAuth) {
            this.contributeIamAuthGrant(apiId, authorizationModes, additionalAuthProviders);
          }

          if (vtlFiles.length > 0) {
            this.contributeResolverCommonDeclarations();
          }
          if (classified.overrideFiles.length > 0) {
            this.contributeResolverOverrides();
          }
          if (classified.extendedDescriptors.length > 0) {
            this.contributeExtendedResolvers(classified.extendedDescriptors);
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
   * Grants the Gen2 authenticated user IAM role access to the Gen1 AppSync API.
   *
   * Post-refactor, the identity pool moves to the Gen2 stack with a new AuthRole.
   * If the Gen1 API uses AWS_IAM auth, the new role needs an explicit policy to
   * call appsync:GraphQL on the Gen1 API during the transition period.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig from amplify-meta.json
  private contributeIamAuthGrant(apiId: string, authorizationModes: any, additionalAuthProviders?: Array<Record<string, unknown>>): void {
    const defaultAuthType = authorizationModes?.defaultAuthentication?.authenticationType;
    const hasIamDefault = defaultAuthType === 'AWS_IAM';
    const hasIamAdditional = additionalAuthProviders?.some((p) => p.authenticationType === 'AWS_IAM') ?? false;

    if (!hasIamDefault && !hasIamAdditional) return;

    this.backendGenerator.addImport('aws-cdk-lib', ['aws_iam']);

    // backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
    //   new aws_iam.PolicyStatement({ effect: aws_iam.Effect.ALLOW, actions: ['appsync:GraphQL'],
    //     resources: [`arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/<apiId>/*`] })
    // )
    const policyStatement = factory.createNewExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('aws_iam'), factory.createIdentifier('PolicyStatement')),
      undefined,
      [
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              'effect',
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('aws_iam'), factory.createIdentifier('Effect')),
                factory.createIdentifier('ALLOW'),
              ),
            ),
            factory.createPropertyAssignment(
              'actions',
              factory.createArrayLiteralExpression([factory.createStringLiteral('appsync:GraphQL')]),
            ),
            factory.createPropertyAssignment(
              'resources',
              factory.createArrayLiteralExpression([
                factory.createTemplateExpression(factory.createTemplateHead('arn:aws:appsync:'), [
                  factory.createTemplateSpan(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(
                        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
                        factory.createIdentifier('stack'),
                      ),
                      factory.createIdentifier('region'),
                    ),
                    factory.createTemplateMiddle(':'),
                  ),
                  factory.createTemplateSpan(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(
                        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
                        factory.createIdentifier('stack'),
                      ),
                      factory.createIdentifier('account'),
                    ),
                    factory.createTemplateTail(`:apis/${apiId}/*`),
                  ),
                ]),
              ]),
            ),
          ],
          true,
        ),
      ],
    );

    const addToPrincipalPolicy = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
              factory.createIdentifier('resources'),
            ),
            factory.createIdentifier('authenticatedUserIamRole'),
          ),
          factory.createIdentifier('addToPrincipalPolicy'),
        ),
        undefined,
        [policyStatement],
      ),
    );

    this.backendGenerator.addStatement(addToPrincipalPolicy);
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
   * Contributes shared declarations needed by both override and extended resolver paths.
   */
  private contributeResolverCommonDeclarations(): void {
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
  }

  /**
   * Contributes resolver override statements to backend.ts.
   *
   * Generates code that reads VTL files from `data/resolvers/` at deploy
   * time, uploads them as CDK Assets to S3, and overrides the pipeline
   * function mapping template S3 locations.
   */
  private contributeResolverOverrides(): void {
    this.backendGenerator.addImport('fs', ['readdirSync']);
    this.backendGenerator.addNamespaceImport('aws-cdk-lib/aws-s3-assets', 'assets');

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
   *     const templatePath = join(resolversDir, file);
   *     const vtlTemplate = new assets.Asset(backend.data, `VTLTemplate-${file}`, { path: templatePath });
   *     if (isRequest) {
   *       pipelineFunction.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
   *     } else {
   *       pipelineFunction.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
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
          // const templatePath = join(resolversDir, file);
          TS.constDecl(
            'templatePath',
            factory.createCallExpression(factory.createIdentifier('join'), undefined, [
              factory.createIdentifier('resolversDir'),
              factory.createIdentifier('file'),
            ]),
          ),
          // const vtlTemplate = new assets.Asset(backend.data, `VTLTemplate-${file}`, { path: templatePath });
          TS.constDecl(
            'vtlTemplate',
            factory.createNewExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('assets'), factory.createIdentifier('Asset')),
              undefined,
              [
                TS.propAccess('backend', 'data') as ts.Expression,
                factory.createTemplateExpression(factory.createTemplateHead('VTLTemplate-'), [
                  factory.createTemplateSpan(factory.createIdentifier('file'), factory.createTemplateTail('')),
                ]),
                factory.createObjectLiteralExpression(
                  [factory.createPropertyAssignment('path', factory.createIdentifier('templatePath'))],
                  false,
                ),
              ],
            ),
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
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('vtlTemplate'),
                      factory.createIdentifier('s3ObjectUrl'),
                    ),
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
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('vtlTemplate'),
                      factory.createIdentifier('s3ObjectUrl'),
                    ),
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

  /** Contributes extended resolver function and pipeline splice statements to backend.ts. */
  private contributeExtendedResolvers(descriptors: readonly ExtendedResolverDescriptor[]): void {
    this.backendGenerator.addImport('aws-cdk-lib', ['aws_appsync']);
    this.backendGenerator.addImport('aws-cdk-lib/aws-appsync', ['CfnResolver']);

    const groups = groupExtendedResolvers(descriptors);

    this.backendGenerator.addStatement(this.defineData.renderNoneDataSource());

    for (const group of groups) {
      const indexed = computeSpliceIndexes(group);

      for (const { fn, spliceIndex } of indexed) {
        const entry: ExtendedResolverFunctionEntry = {
          typeName: fn.typeName,
          fieldName: fn.fieldName,
          slot: fn.slot,
          order: fn.order,
          requestFile: fn.requestFile,
          responseFile: fn.responseFile,
          spliceIndex,
        };
        this.backendGenerator.addStatement(this.defineData.renderAppsyncFunction(entry));
      }

      const spliceArgs = indexed.map(({ fn, spliceIndex }) => ({
        constructName: `${fn.typeName}${fn.fieldName}${fn.slot}${fn.order}`,
        spliceIndex,
      }));
      const spliceStatements = this.defineData.renderSpliceStatements(group.typeName, group.fieldName, spliceArgs);
      for (const stmt of spliceStatements) {
        this.backendGenerator.addStatement(stmt);
      }
    }
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

/** Parses an extended resolver VTL filename into its components. */
export function parseExtendedResolverFilename(filename: string): ExtendedResolverDescriptor {
  const segments = filename.split('.');
  const typeName = segments[0];
  const fieldName = segments[1];
  const slot = segments[2];
  const orderStr = segments[3];
  const templateType = segments[4] as 'req' | 'res';

  if (!VALID_SLOTS.includes(slot as Slot)) {
    throw new Error(`Invalid slot '${slot}' in resolver file '${filename}'. Valid slots: ${VALID_SLOTS.join(', ')}`);
  }

  const order = Number(orderStr);
  if (Number.isNaN(order)) {
    throw new Error(`Non-numeric order '${orderStr}' in resolver file '${filename}'`);
  }

  return { typeName, fieldName, slot: slot as Slot, order, templateType, filename };
}

/** Classifies VTL resolver files as override or extended resolvers. */
export function classifyResolverFiles(vtlFiles: readonly string[]): ClassifiedResolvers {
  const overrideFiles: string[] = [];
  const extendedDescriptors: ExtendedResolverDescriptor[] = [];

  for (const file of vtlFiles) {
    const segmentCount = file.split('.').length;
    if (segmentCount === 4) {
      overrideFiles.push(file);
    } else if (segmentCount === 6) {
      extendedDescriptors.push(parseExtendedResolverFilename(file));
    }
  }

  for (let i = 0; i < extendedDescriptors.length; i++) {
    for (let j = i + 1; j < extendedDescriptors.length; j++) {
      const a = extendedDescriptors[i];
      const b = extendedDescriptors[j];
      if (
        a.typeName === b.typeName &&
        a.fieldName === b.fieldName &&
        a.slot === b.slot &&
        a.order === b.order &&
        a.templateType === b.templateType
      ) {
        throw new Error(
          `Duplicate extended resolver template: '${a.filename}' and '${b.filename}' both define ${a.templateType} for ${a.typeName}.${a.fieldName}.${a.slot}.${a.order}`,
        );
      }
    }
  }

  return { overrideFiles, extendedDescriptors };
}

/** Groups extended resolver descriptors by pipeline resolver and pairs request/response templates. */
export function groupExtendedResolvers(descriptors: readonly ExtendedResolverDescriptor[]): readonly PipelineResolverGroup[] {
  const groups = new Map<string, ExtendedResolverDescriptor[]>();

  for (const descriptor of descriptors) {
    const key = `${descriptor.typeName}.${descriptor.fieldName}`;
    const group = groups.get(key);
    if (group) {
      group.push(descriptor);
    } else {
      groups.set(key, [descriptor]);
    }
  }

  const result: PipelineResolverGroup[] = [];

  for (const [, groupDescriptors] of groups) {
    const sorted = [...groupDescriptors].sort((a, b) => {
      const slotDiff = VALID_SLOTS.indexOf(a.slot) - VALID_SLOTS.indexOf(b.slot);
      if (slotDiff !== 0) return slotDiff;
      return a.order - b.order;
    });

    const pairMap = new Map<string, { req?: string; res?: string }>();
    for (const desc of sorted) {
      const pairKey = `${desc.slot}.${desc.order}`;
      const existing = pairMap.get(pairKey) ?? {};
      if (desc.templateType === 'req') {
        existing.req = desc.filename;
      } else {
        existing.res = desc.filename;
      }
      pairMap.set(pairKey, existing);
    }

    const functions: ExtendedResolverFunction[] = [];
    const seen = new Set<string>();

    for (const desc of sorted) {
      const pairKey = `${desc.slot}.${desc.order}`;
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const pair = pairMap.get(pairKey)!;
      functions.push({
        typeName: desc.typeName,
        fieldName: desc.fieldName,
        slot: desc.slot,
        order: desc.order,
        requestFile: pair.req,
        responseFile: pair.res,
      });
    }

    result.push({
      typeName: sorted[0].typeName,
      fieldName: sorted[0].fieldName,
      functions,
    });
  }

  return result;
}

/** Computes splice indexes for extended resolver functions within a pipeline resolver group. */
export function computeSpliceIndexes(
  group: PipelineResolverGroup,
): readonly { readonly fn: ExtendedResolverFunction; readonly spliceIndex: number }[] {
  const result: { readonly fn: ExtendedResolverFunction; readonly spliceIndex: number }[] = [];
  let offset = 0;

  for (const fn of group.functions) {
    const baseIndex = SLOT_BASE_INDEX[fn.slot];
    const spliceIndex = baseIndex + offset;
    result.push({ fn, spliceIndex });
    offset++;
  }

  return result;
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
