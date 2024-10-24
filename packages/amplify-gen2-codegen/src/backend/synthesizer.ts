import ts, {
  Node,
  ExpressionStatement,
  CallExpression,
  Expression,
  VariableDeclaration,
  Identifier,
  NodeArray,
  ImportDeclaration,
  VariableStatement,
} from 'typescript';
import { PolicyOverrides } from '../auth/source_builder.js';
import { BucketAccelerateStatus, BucketVersioningStatus } from '@aws-sdk/client-s3';
import { AccessPatterns, ServerSideEncryptionConfiguration } from '../storage/source_builder.js';
import assert from 'assert';
const factory = ts.factory;
export interface BackendRenderParameters {
  data?: {
    importFrom: string;
  };
  auth?: {
    importFrom: string;
    userPoolOverrides?: PolicyOverrides;
    guestLogin?: boolean;
    identityPoolName?: string;
    oAuthFlows?: string[];
    readAttributes?: string[];
    writeAttributes?: string[];
  };
  storage?: {
    importFrom: string;
    dynamoDB?: string;
    accelerateConfiguration?: BucketAccelerateStatus;
    versionConfiguration?: BucketVersioningStatus;
    hasS3Bucket?: string | AccessPatterns | undefined;
    bucketEncryptionAlgorithm?: ServerSideEncryptionConfiguration;
    bucketName?: string;
  };

  function?: {
    importFrom: string;
    functionNamesAndCategories: Map<string, string>;
  };
  unsupportedCategories?: Map<string, string>;
}

export class BackendSynthesizer {
  private createPropertyAccessExpression(objectIdentifier: Identifier, propertyPath: string): Expression {
    const parts = propertyPath.split('.');
    let expression: Expression = objectIdentifier;
    for (let i = 0; i < parts.length; i++) {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(parts[i]));
    }
    return expression;
  }

  private createVariableDeclaration(identifierName: string, propertyPath: string): VariableDeclaration {
    const identifier = factory.createIdentifier(identifierName);
    const propertyAccessExpression = this.createPropertyAccessExpression(factory.createIdentifier('backend'), propertyPath);
    return factory.createVariableDeclaration(identifier, undefined, undefined, propertyAccessExpression);
  }

  private createVariableStatement(variableDeclaration: VariableDeclaration): VariableStatement {
    return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
  }

  private createImportStatement(identifiers: Identifier[], backendPackageName: string): ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports(identifiers.map((identifier) => factory.createImportSpecifier(false, undefined, identifier))),
      ),
      factory.createStringLiteral(backendPackageName),
    );
  }

  private defineBackendCall(backendFunctionIdentifier: Identifier, properties: ts.ObjectLiteralElementLike[]): CallExpression {
    const backendFunctionArgs = factory.createObjectLiteralExpression(properties, true);
    return factory.createCallExpression(backendFunctionIdentifier, undefined, [backendFunctionArgs]);
  }

  private setPropertyValue(
    objectIdentifier: Identifier,
    propertyPath: string,
    value: number | string | boolean | string[] | object | undefined,
  ): ExpressionStatement {
    const propertyAccessExpression = this.createPropertyAccessExpression(objectIdentifier, propertyPath);
    const overrideValue = this.getOverrideValue(value);

    return factory.createExpressionStatement(factory.createAssignment(propertyAccessExpression, overrideValue));
  }

  private getOverrideValue(value: number | string | boolean | string[] | object | undefined): Expression {
    if (typeof value === 'number') {
      return factory.createNumericLiteral(value);
    } else if (typeof value === 'string') {
      return factory.createStringLiteral(value);
    } else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return factory.createArrayLiteralExpression(value.map((item) => factory.createStringLiteral(item)));
    } else if (typeof value === 'boolean') {
      return value ? factory.createTrue() : factory.createFalse();
    } else if (typeof value === 'object' && value !== null) {
      const properties: ts.PropertyAssignment[] = [];
      for (const [key, val] of Object.entries(value)) {
        const property = factory.createPropertyAssignment(factory.createIdentifier(key), this.getOverrideValue(val));
        properties.push(property);
      }
      return factory.createObjectLiteralExpression(properties, true);
    } else if (value === undefined) {
      return factory.createIdentifier('undefined');
    }
    throw new TypeError(`Unrecognized type: ${typeof value}`);
  }

  render(renderArgs: BackendRenderParameters): NodeArray<Node> {
    const authFunctionIdentifier = factory.createIdentifier('auth');
    const storageFunctionIdentifier = factory.createIdentifier('storage');
    const dataFunctionIdentifier = factory.createIdentifier('data');
    const backendFunctionIdentifier = factory.createIdentifier('defineBackend');

    const imports = [];
    const errors: ts.CallExpression[] = [];
    const defineBackendProperties = [];
    const nodes = [];

    const mappedPolicyType: Record<string, string> = {
      MinimumLength: 'minimumLength',
      RequireUppercase: 'requireUppercase',
      RequireLowercase: 'requireLowercase',
      RequireNumbers: 'requireNumbers',
      RequireSymbols: 'requireSymbols',
      PasswordHistorySize: 'passwordHistorySize',
      TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
    };

    if (renderArgs.auth) {
      imports.push(this.createImportStatement([authFunctionIdentifier], renderArgs.auth.importFrom));
      const auth = factory.createShorthandPropertyAssignment(authFunctionIdentifier);
      defineBackendProperties.push(auth);
    }

    if (renderArgs.data) {
      imports.push(this.createImportStatement([dataFunctionIdentifier], renderArgs.data.importFrom));
      const data = factory.createShorthandPropertyAssignment(dataFunctionIdentifier);
      defineBackendProperties.push(data);
    }

    if (renderArgs.storage?.hasS3Bucket) {
      imports.push(this.createImportStatement([storageFunctionIdentifier], renderArgs.storage.importFrom));
      imports.push(this.createImportStatement([factory.createIdentifier('RemovalPolicy')], 'aws-cdk-lib'));
      const storage = factory.createShorthandPropertyAssignment(storageFunctionIdentifier);
      defineBackendProperties.push(storage);
    }

    if (renderArgs.function) {
      const functionIdentifiers: Identifier[] = [];
      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      for (const [functionName, category] of functionNameCategories) {
        functionIdentifiers.push(factory.createIdentifier(functionName));
        const functionProperty = factory.createShorthandPropertyAssignment(factory.createIdentifier(functionName));
        defineBackendProperties.push(functionProperty);
        imports.push(this.createImportStatement([factory.createIdentifier(functionName)], `./${category}/${functionName}/resource`));
      }
    }

    if (renderArgs.storage?.dynamoDB) {
      nodes.push(
        factory.createThrowStatement(
          factory.createNewExpression(factory.createIdentifier('Error'), undefined, [
            factory.createStringLiteral(
              `DynamoDB table \`${renderArgs.storage.dynamoDB}\` is referenced in your Gen 1 backend and will need to be manually migrated to reference with CDK.`,
            ),
          ]),
        ),
      );
    }

    imports.push(this.createImportStatement([backendFunctionIdentifier], '@aws-amplify/backend'));

    if (renderArgs.unsupportedCategories) {
      const categories = renderArgs.unsupportedCategories;

      for (const [key, value] of categories) {
        if (key == 'custom') {
          errors.push(
            factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
              factory.createStringLiteral(`Category ${key} has changed, learn more ${value}`),
            ]),
          );
        } else {
          errors.push(
            factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
              factory.createStringLiteral(`Category ${key} is unsupported, please follow ${value}`),
            ]),
          );
        }
      }
    }

    const callBackendFn = this.defineBackendCall(backendFunctionIdentifier, defineBackendProperties);
    const backendVariable = factory.createVariableDeclaration('backend', undefined, undefined, callBackendFn);
    const backendStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([backendVariable], ts.NodeFlags.Const),
    );

    if (renderArgs.auth?.userPoolOverrides) {
      const cfnUserPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnUserPool', 'auth.resources.cfnResources.cfnUserPool'),
      );
      nodes.push(cfnUserPoolVariableStatement);
      const policies: { passwordPolicy: Record<string, number | string | boolean | string[]> } = {
        passwordPolicy: {},
      };
      for (const [overridePath, value] of Object.entries(renderArgs.auth.userPoolOverrides)) {
        if (overridePath.includes('PasswordPolicy')) {
          const policyKey = overridePath.split('.')[2];
          if (value !== undefined && policyKey in mappedPolicyType) {
            policies.passwordPolicy[mappedPolicyType[policyKey] as string] = value;
          }
        } else {
          nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPool'), overridePath, value));
        }
      }
      nodes.push(
        this.setPropertyValue(
          factory.createIdentifier('cfnUserPool'),
          'policies',
          policies as number | string | boolean | string[] | object,
        ),
      );
    }

    if (renderArgs.auth?.guestLogin === false || renderArgs.auth?.identityPoolName) {
      const cfnIdentityPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnIdentityPool', 'auth.resources.cfnResources.cfnIdentityPool'),
      );
      nodes.push(cfnIdentityPoolVariableStatement);
      if (renderArgs.auth?.identityPoolName) {
        nodes.push(
          this.setPropertyValue(factory.createIdentifier('cfnIdentityPool'), 'identityPoolName', renderArgs.auth.identityPoolName),
        );
      }
      if (renderArgs.auth?.guestLogin === false) {
        nodes.push(this.setPropertyValue(factory.createIdentifier('cfnIdentityPool'), 'allowUnauthenticatedIdentities', false));
      }
    }

    if (renderArgs.auth?.oAuthFlows || renderArgs.auth?.readAttributes || renderArgs.auth?.writeAttributes) {
      const cfnUserPoolClientVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnUserPoolClient', 'auth.resources.cfnResources.cfnUserPoolClient'),
      );
      nodes.push(cfnUserPoolClientVariableStatement);
      if (renderArgs.auth?.oAuthFlows) {
        nodes.push(
          this.setPropertyValue(
            factory.createIdentifier('cfnUserPoolClient'),
            'allowedOAuthFlows',
            renderArgs.auth?.oAuthFlows as number | string | boolean | string[],
          ),
        );
      }

      if (renderArgs.auth?.readAttributes) {
        nodes.push(
          this.setPropertyValue(
            factory.createIdentifier('cfnUserPoolClient'),
            'readAttributes',
            renderArgs.auth?.readAttributes as number | string | boolean | string[],
          ),
        );
      }
    }

    if (renderArgs.auth?.writeAttributes) {
      nodes.push(
        this.setPropertyValue(
          factory.createIdentifier('cfnUserPoolClient'),
          'writeAttributes',
          renderArgs.auth?.writeAttributes as string[],
        ),
      );
    }

    if (renderArgs.storage && renderArgs.storage.hasS3Bucket) {
      assert(renderArgs.storage.bucketName);
      const cfnStorageVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('s3Bucket', 'storage.resources.cfnResources.cfnBucket'),
      );
      nodes.push(cfnStorageVariableStatement);

      const bucketNameAssignment = factory.createExpressionStatement(
        factory.createAssignment(
          factory.createPropertyAccessExpression(factory.createIdentifier('// s3Bucket'), factory.createIdentifier('bucketName')),
          factory.createStringLiteral(renderArgs.storage.bucketName),
        ),
      );

      nodes.push(bucketNameAssignment);

      const removalPolicyAssignment = factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('s3Bucket'), factory.createIdentifier('applyRemovalPolicy')),
        undefined,
        [
          factory.createIdentifier('RemovalPolicy.RETAIN'),
          factory.createObjectLiteralExpression(
            [factory.createPropertyAssignment(factory.createIdentifier('applyToUpdateReplacePolicy'), factory.createTrue())],
            false,
          ),
        ],
      );

      nodes.push(removalPolicyAssignment);
    }

    if (
      renderArgs.storage?.accelerateConfiguration ||
      renderArgs.storage?.versionConfiguration ||
      renderArgs.storage?.bucketEncryptionAlgorithm
    ) {
      if (renderArgs.storage?.accelerateConfiguration) {
        const accelerateConfigAssignment = factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('s3Bucket'),
              factory.createIdentifier('accelerateConfiguration'),
            ),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('accelerationStatus'),
                  factory.createStringLiteral(renderArgs.storage.accelerateConfiguration),
                ),
              ],
              false,
            ),
          ),
        );
        nodes.push(accelerateConfigAssignment);
      }

      if (renderArgs.storage?.versionConfiguration) {
        const versionConfigAssignment = factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('s3Bucket'),
              factory.createIdentifier('versioningConfiguration'),
            ),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('status'),
                  factory.createStringLiteral(renderArgs.storage.versionConfiguration),
                ),
              ],
              false,
            ),
          ),
        );
        nodes.push(versionConfigAssignment);
      }

      if (renderArgs.storage?.bucketEncryptionAlgorithm) {
        const bucketEncryptionAssignment = factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(factory.createIdentifier('s3Bucket'), factory.createIdentifier('bucketEncryption')),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('serverSideEncryptionConfiguration'),
                  factory.createArrayLiteralExpression(
                    [
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            factory.createIdentifier('serverSideEncryptionByDefault'),
                            factory.createObjectLiteralExpression(
                              [
                                factory.createPropertyAssignment(
                                  factory.createIdentifier('sseAlgorithm'),
                                  factory.createStringLiteral(
                                    renderArgs.storage.bucketEncryptionAlgorithm.serverSideEncryptionByDefault.SSEAlgorithm!,
                                  ),
                                ),
                                factory.createPropertyAssignment(
                                  factory.createIdentifier('kmsMasterKeyId'),
                                  factory.createStringLiteral(
                                    renderArgs.storage.bucketEncryptionAlgorithm.serverSideEncryptionByDefault.KMSMasterKeyID!,
                                  ),
                                ),
                              ],
                              true,
                            ),
                          ),
                          factory.createPropertyAssignment(
                            factory.createIdentifier('bucketKeyEnabled'),
                            renderArgs.storage.bucketEncryptionAlgorithm.bucketKeyEnabled! ? factory.createTrue() : factory.createFalse(),
                          ),
                        ],
                        true,
                      ),
                    ],
                    true,
                  ),
                ),
              ],
              true,
            ),
          ),
        );
        nodes.push(bucketEncryptionAssignment);
      }

      imports.push(
        factory.createImportDeclaration(
          undefined,
          factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier('s3'))),
          factory.createStringLiteral('aws-cdk-lib/aws-s3'),
        ),
      );
    }
    return factory.createNodeArray([...imports, ...errors, backendStatement, ...nodes], true);
  }
}
