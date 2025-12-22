import ts, {
  CallExpression,
  Expression,
  ExpressionStatement,
  Identifier,
  ImportDeclaration,
  Node,
  NodeArray,
  VariableDeclaration,
  VariableStatement,
} from 'typescript';
import { PolicyOverrides, ReferenceAuth } from '../generators/auth';
import type { BucketAccelerateStatus, BucketVersioningStatus } from '@aws-sdk/client-s3';
import { AccessPatterns, ServerSideEncryptionConfiguration } from '../generators/storage';
import { DynamoDBTableDefinition } from '../adapters/storage';
import { ExplicitAuthFlowsType, OAuthFlowType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import assert from 'assert';
import { newLineIdentifier } from '../ts_factory_utils';
import type { AdditionalAuthProvider } from '../generators/data';
import { RestApiDefinition } from '../codegen-head/data_definition_fetcher';

const factory = ts.factory;
export interface BackendRenderParameters {
  data?: {
    importFrom: string;
    additionalAuthProviders?: AdditionalAuthProvider[];
    restApis?: RestApiDefinition[];
  };
  auth?: {
    importFrom: string;
    userPoolOverrides?: PolicyOverrides;
    guestLogin?: boolean;
    identityPoolName?: string;
    oAuthFlows?: string[];
    readAttributes?: string[];
    writeAttributes?: string[];
    referenceAuth?: ReferenceAuth;
    userPoolClient?: UserPoolClientType;
  };
  storage?: {
    importFrom: string;
    dynamoDB?: string;
    dynamoTables?: DynamoDBTableDefinition[];
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
  customResources?: Map<string, string>;
  unsupportedCategories?: Map<string, string>;
}

// const amplifyGen1EnvName = 'AMPLIFY_GEN_1_ENV_NAME';

export class BackendSynthesizer {
  private importDurationFlag = false;
  private oAuthFlag = false;
  private readWriteAttributeFlag = false;
  private supportedIdentityProviderFlag = false;

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

  private createBooleanPropertyAssignment(identifier: string, condition: boolean) {
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), condition ? factory.createTrue() : factory.createFalse());
  }

  private createListPropertyAssignment(identifier: string, listAttribute: string[]) {
    return factory.createPropertyAssignment(
      factory.createIdentifier(identifier),
      factory.createArrayLiteralExpression(listAttribute.map((attribute) => factory.createStringLiteral(attribute))),
    );
  }

  private createEnumListPropertyAssignment(identifier: string, enumIdentifier: string, listAttribute: string[]) {
    return factory.createPropertyAssignment(
      factory.createIdentifier(identifier),
      factory.createArrayLiteralExpression(
        listAttribute.map((attribute) =>
          factory.createPropertyAccessExpression(factory.createIdentifier(enumIdentifier), factory.createIdentifier(attribute)),
        ),
        true,
      ),
    );
  }

  private createNumericPropertyAssignment(identifier: string, numericLiteral: number) {
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), factory.createNumericLiteral(numericLiteral));
  }

  private createDurationPropertyAssignment(identifier: string, numericLiteral: number, durationUnit: string) {
    const duration = factory.createCallExpression(factory.createIdentifier(`Duration.${durationUnit}`), undefined, [
      factory.createNumericLiteral(numericLiteral),
    ]);
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), duration);
  }

  private createStringPropertyAssignment(identifier: string, stringLiteral: string) {
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), factory.createStringLiteral(stringLiteral));
  }

  private createUserPoolClientAssignment(userPoolClient: UserPoolClientType, imports: ts.ImportDeclaration[], createConstant: boolean) {
    const userPoolClientAttributesMap = new Map<string, string>();

    userPoolClientAttributesMap.set('ClientSecret', 'generateSecret');
    userPoolClientAttributesMap.set('ReadAttributes', 'readAttributes');
    userPoolClientAttributesMap.set('WriteAttributes', 'writeAttributes');
    userPoolClientAttributesMap.set('RefreshTokenValidity', 'refreshTokenValidity');
    userPoolClientAttributesMap.set('AccessTokenValidity', 'accessTokenValidity');
    userPoolClientAttributesMap.set('IdTokenValidity', 'idTokenValidity');
    userPoolClientAttributesMap.set('RefreshToken', 'refreshToken');
    userPoolClientAttributesMap.set('AccessToken', 'accessToken');
    userPoolClientAttributesMap.set('IdToken', 'idToken');
    userPoolClientAttributesMap.set('AllowedOAuthScopes', 'scopes');
    userPoolClientAttributesMap.set('CallbackURLs', 'callbackUrls');
    userPoolClientAttributesMap.set('LogoutURLs', 'logoutUrls');
    userPoolClientAttributesMap.set('DefaultRedirectURI', 'defaultRedirectUri');
    userPoolClientAttributesMap.set('AllowedOAuthFlowsUserPoolClient', 'disableOAuth');
    userPoolClientAttributesMap.set('EnableTokenRevocation', 'enableTokenRevocation');
    userPoolClientAttributesMap.set('EnablePropagateAdditionalUserContextData', 'enablePropagateAdditionalUserContextData');
    userPoolClientAttributesMap.set('SupportedIdentityProviders', 'supportedIdentityProviders');
    userPoolClientAttributesMap.set('AuthSessionValidity', 'authSessionValidity');
    userPoolClientAttributesMap.set('ExplicitAuthFlows', 'authFlows');
    userPoolClientAttributesMap.set('AllowedOAuthFlows', 'flows');

    const addClientCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('addClient')),
      undefined,
      [factory.createStringLiteral('NativeAppClient'), this.createNestedObjectExpression(userPoolClient, userPoolClientAttributesMap)],
    );

    if (this.importDurationFlag) {
      imports.push(this.createImportStatement([factory.createIdentifier('Duration')], 'aws-cdk-lib'));
    }

    if (this.readWriteAttributeFlag || this.oAuthFlag || this.supportedIdentityProviderFlag) {
      const identifiers = [
        ...(this.readWriteAttributeFlag ? [factory.createIdentifier('ClientAttributes')] : []),
        ...(this.oAuthFlag ? [factory.createIdentifier('OAuthScope')] : []),
        ...(this.supportedIdentityProviderFlag ? [factory.createIdentifier('UserPoolClientIdentityProvider')] : []),
      ];

      if (identifiers.length > 0) {
        imports.push(this.createImportStatement(identifiers, 'aws-cdk-lib/aws-cognito'));
      }
    }

    if (createConstant) {
      // Create const userPoolClient = userPool.addClient(...)
      return factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [factory.createVariableDeclaration(factory.createIdentifier('userPoolClient'), undefined, undefined, addClientCall)],
          ts.NodeFlags.Const,
        ),
      );
    } else {
      // Just create the userPool.addClient(...) expression statement
      return factory.createExpressionStatement(addClientCall);
    }
  }

  private createPropertyAccessChain(identifiers: string[]): ts.Expression {
    return identifiers
      .slice(1)
      .reduce<ts.Expression>(
        (acc, curr) => factory.createPropertyAccessExpression(acc, factory.createIdentifier(curr)),
        factory.createIdentifier(identifiers[0]),
      );
  }

  private getProviderSetupDeclaration(): ts.VariableStatement {
    const providerSetupResult = 'providerSetupResult';
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(providerSetupResult),
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createParenthesizedExpression(
                factory.createAsExpression(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      this.createPropertyAccessChain(['backend', 'auth', 'stack', 'node', 'children']),
                      factory.createIdentifier('find'),
                    ),
                    undefined,
                    [
                      factory.createArrowFunction(
                        undefined,
                        undefined,
                        [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('child'))],
                        undefined,
                        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        factory.createBinaryExpression(
                          this.createPropertyAccessChain(['child', 'node', 'id']),
                          factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                          factory.createStringLiteral('amplifyAuth'),
                        ),
                      ),
                    ],
                  ),
                  factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                ),
              ),
              factory.createIdentifier(providerSetupResult),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private getProviderSetupForeachStatement(): ExpressionStatement {
    const providerSetupResult = 'providerSetupResult';
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Object'), factory.createIdentifier('keys')),
            undefined,
            [factory.createIdentifier(providerSetupResult)],
          ),
          factory.createIdentifier('forEach'),
        ),
        undefined,
        [
          factory.createArrowFunction(
            undefined,
            undefined,
            [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('provider'))],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              [
                // const providerSetupPropertyValue = providerSetupResult[provider]
                factory.createVariableStatement(
                  undefined,
                  factory.createVariableDeclarationList(
                    [
                      factory.createVariableDeclaration(
                        factory.createIdentifier('providerSetupPropertyValue'),
                        undefined,
                        undefined,
                        factory.createElementAccessExpression(
                          factory.createIdentifier(providerSetupResult),
                          factory.createIdentifier('provider'),
                        ),
                      ),
                    ],
                    ts.NodeFlags.Const,
                  ),
                ),
                // if condition
                factory.createIfStatement(
                  factory.createLogicalAnd(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('providerSetupPropertyValue'),
                      factory.createIdentifier('node'),
                    ),
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            this.createPropertyAccessChain(['providerSetupPropertyValue', 'node', 'id']),
                            factory.createIdentifier('toLowerCase'),
                          ),
                          undefined,
                          [],
                        ),
                        factory.createIdentifier('endsWith'),
                      ),
                      undefined,
                      [factory.createStringLiteral('idp')],
                    ),
                  ),
                  factory.createBlock(
                    [
                      factory.createExpressionStatement(
                        factory.createCallExpression(
                          this.createPropertyAccessChain(['userPoolClient', 'node', 'addDependency']),
                          undefined,
                          [factory.createIdentifier('providerSetupPropertyValue')],
                        ),
                      ),
                    ],
                    true,
                  ),
                ),
              ],
              true,
            ),
          ),
        ],
      ),
    );
  }

  private createProviderSetupCode(): ts.Statement[] {
    // Create const providerSetupResult = (backend.auth.stack.node.children.find(child => child.node.id === "amplifyAuth") as any).providerSetupResult;
    const providerSetupDeclaration = this.getProviderSetupDeclaration();

    // Create Object.keys(providerSetupResult).forEach(...)
    const forEachStatement = this.getProviderSetupForeachStatement();

    return [providerSetupDeclaration, forEachStatement];
  }

  private createNestedObjectExpression(object: any, gen2PropertyMap: Map<string, string>): ts.ObjectLiteralExpression {
    const objectLiterals = [];
    const clientSecretKey = 'ClientSecret';

    for (const [key, value] of Object.entries(object)) {
      const mappedProperty = gen2PropertyMap.get(key);
      if (mappedProperty) {
        if (typeof value == 'boolean') {
          if (key === 'AllowedOAuthFlowsUserPoolClient') {
            // CDK equivalent is disableOAuth which is opposite of this prop
            objectLiterals.push(this.createBooleanPropertyAssignment(mappedProperty, !value));
          } else {
            objectLiterals.push(this.createBooleanPropertyAssignment(mappedProperty, value));
          }
        } else if (typeof value == 'string') {
          if (!this.oAuthFlag && key == 'DefaultRedirectURI') {
            this.oAuthFlag = true;
            objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
          } else if (key === clientSecretKey) {
            objectLiterals.push(this.createBooleanPropertyAssignment(mappedProperty, true));
          } else if (key != 'DefaultRedirectURI') {
            objectLiterals.push(this.createStringPropertyAssignment(mappedProperty, value));
          }
        } else if (typeof value == 'number') {
          if (['IdTokenValidity', 'RefreshTokenValidity', 'AccessTokenValidity', 'AuthSessionValidity'].includes(key)) {
            // convert it to Duration
            this.importDurationFlag = true;
            if (key == 'IdTokenValidity') {
              let durationUnit = 'hours';
              if (object['TokenValidityUnits'] && object['TokenValidityUnits'].IdToken) {
                durationUnit = object['TokenValidityUnits'].IdToken;
              }
              objectLiterals.push(this.createDurationPropertyAssignment(mappedProperty, value, durationUnit));
            } else if (key == 'RefreshTokenValidity') {
              let durationUnit = 'days';
              if (object['TokenValidityUnits'] && object['TokenValidityUnits'].RefreshToken) {
                durationUnit = object['TokenValidityUnits'].RefreshToken;
              }
              objectLiterals.push(this.createDurationPropertyAssignment(mappedProperty, value, durationUnit));
            } else if (key == 'AccessTokenValidity') {
              let durationUnit = 'hours';
              if (object['TokenValidityUnits'] && object['TokenValidityUnits'].AccessToken) {
                durationUnit = object['TokenValidityUnits'].AccessToken;
              }
              objectLiterals.push(this.createDurationPropertyAssignment(mappedProperty, value, durationUnit));
            } else if (key == 'AuthSessionValidity') {
              objectLiterals.push(this.createDurationPropertyAssignment(mappedProperty, value, 'minutes'));
            }
          } else {
            objectLiterals.push(this.createNumericPropertyAssignment(mappedProperty, value));
          }
        } else if (Array.isArray(value) && gen2PropertyMap.has(key)) {
          if (key == 'ReadAttributes' || key == 'WriteAttributes') {
            objectLiterals.push(this.createReadWriteAttributes(mappedProperty, value));
          } else if (key == 'SupportedIdentityProviders') {
            this.supportedIdentityProviderFlag = true;
            // Providers are upper case in CDK
            objectLiterals.push(
              this.createEnumListPropertyAssignment(
                mappedProperty,
                'UserPoolClientIdentityProvider',
                value.map((provider) => {
                  if (provider.toUpperCase() == 'LOGINWITHAMAZON') {
                    return 'AMAZON';
                  } else if (provider.toUpperCase() === 'SIGNINWITHAPPLE') {
                    return 'APPLE';
                  }
                  return provider.toUpperCase();
                }),
              ),
            );
          } else if (!this.oAuthFlag && key == 'AllowedOAuthFlows') {
            this.oAuthFlag = true;
            objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
          } else if (key == 'ExplicitAuthFlows') {
            objectLiterals.push(
              factory.createPropertyAssignment(factory.createIdentifier(mappedProperty), this.createAuthFlowsObjectExpression(value)),
            );
          } else if (!this.oAuthFlag && key == 'AllowedOAuthScopes') {
            this.oAuthFlag = true;
            objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
          } else {
            if (!this.oAuthFlag && (key == 'CallbackURLs' || key == 'LogoutURLs')) {
              this.oAuthFlag = true;
              objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
            } else if (key != 'CallbackURLs' && key != 'LogoutURLs' && key != 'AllowedOAuthScopes') {
              objectLiterals.push(this.createListPropertyAssignment(mappedProperty, value));
            }
          }
        } else if (typeof value == 'object' && value !== null) {
          objectLiterals.push(
            factory.createPropertyAssignment(factory.createIdentifier(key), this.createNestedObjectExpression(value, gen2PropertyMap)),
          );
        }
      }
    }
    // We need to set generateSecret to false explicitly when not defined.
    // If it's set as undefined and current value in CFN template is false (moved from gen1 after refactor), CFN thinks the property has changed
    // and requests for creation of a new resource (user pool client) instead of an update.
    if (object[clientSecretKey] === undefined && gen2PropertyMap.has(clientSecretKey)) {
      const mappedClientSecretKey = gen2PropertyMap.get(clientSecretKey);
      assert(mappedClientSecretKey);
      objectLiterals.push(this.createBooleanPropertyAssignment(mappedClientSecretKey, false));
    }
    return factory.createObjectLiteralExpression(objectLiterals, true);
  }

  private createReadWriteAttributes(identifier: string, attributes: string[]) {
    const standardAttrMap = new Map<string, string>();
    standardAttrMap.set('address', 'address');
    standardAttrMap.set('birthdate', 'birthdate');
    standardAttrMap.set('email', 'email');
    standardAttrMap.set('family_name', 'familyName');
    standardAttrMap.set('gender', 'gender');
    standardAttrMap.set('given_name', 'givenName');
    standardAttrMap.set('locale', 'locale');
    standardAttrMap.set('middle_name', 'middleName');
    standardAttrMap.set('name', 'fullname');
    standardAttrMap.set('nickname', 'nickname');
    standardAttrMap.set('phone_number', 'phoneNumber');
    standardAttrMap.set('picture', 'profilePicture');
    standardAttrMap.set('preferred_username', 'preferredUsername');
    standardAttrMap.set('profile', 'profilePage');
    standardAttrMap.set('updated_at', 'lastUpdateTime');
    standardAttrMap.set('website', 'website');
    standardAttrMap.set('zoneinfo', 'timezone');
    standardAttrMap.set('email_verified', 'emailVerified');
    standardAttrMap.set('phone_number_verified', 'phoneNumberVerified');

    this.readWriteAttributeFlag = true;
    const standardAttributes = attributes.filter((attribute) => !attribute.startsWith('custom:'));
    const standardAttributesLiterals: ts.PropertyAssignment[] = [];
    standardAttributes.forEach((attribute) => {
      if (standardAttrMap.has(attribute)) {
        const mappedAttribute = standardAttrMap.get(attribute);
        if (mappedAttribute) {
          standardAttributesLiterals.push(
            factory.createPropertyAssignment(factory.createIdentifier(mappedAttribute), factory.createTrue()),
          );
        }
      }
    });

    let clientAttributes = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('new ClientAttributes()'),
        factory.createIdentifier('withStandardAttributes'),
      ),
      undefined,
      [factory.createObjectLiteralExpression(standardAttributesLiterals, true)],
    );

    const customAttributes = attributes.filter((attribute) => attribute.startsWith('custom:'));

    if (customAttributes) {
      clientAttributes = factory.createCallExpression(
        factory.createPropertyAccessExpression(clientAttributes, factory.createIdentifier('withCustomAttributes')),
        undefined,
        customAttributes.map((attr) => factory.createStringLiteral(attr)),
      );
    }

    return factory.createPropertyAssignment(factory.createIdentifier(identifier), clientAttributes);
  }

  private mapOAuthScopes(scopes: string[]) {
    const scopeMap = new Map<string, string>();
    scopeMap.set('phone', 'PHONE');
    scopeMap.set('email', 'EMAIL');
    scopeMap.set('openid', 'OPENID');
    scopeMap.set('profile', 'PROFILE');
    scopeMap.set('aws.cognito.signin.user.admin', 'COGNITO_ADMIN');

    const scopesList: string[] = [];
    scopes.forEach((scope) => {
      if (scopeMap.has(scope)) {
        const scopeValue = scopeMap.get(scope);
        if (scopeValue) {
          scopesList.push(scopeValue);
        }
      }
    });
    return scopesList;
  }

  private createOAuthObjectExpression(object: Record<string, any>, map: Map<string, string>) {
    const oAuthLiterals = [];

    for (const [key, value] of Object.entries(object)) {
      if (key == 'AllowedOAuthFlows') {
        oAuthLiterals.push(
          factory.createPropertyAssignment(factory.createIdentifier('flows'), this.createOAuthFlowsObjectExpression(value)),
        );
      } else if (key == 'AllowedOAuthScopes') {
        oAuthLiterals.push(this.createEnumListPropertyAssignment('scopes', 'OAuthScope', this.mapOAuthScopes(value)));
      } else if (key == 'CallbackURLs' || key == 'LogoutURLs') {
        const urlValue = map.get(key);
        if (urlValue) {
          oAuthLiterals.push(this.createListPropertyAssignment(urlValue, value));
        }
      } else if (key == 'DefaultRedirectURI') {
        const redirectUriValue = map.get(key);
        if (redirectUriValue) {
          oAuthLiterals.push(this.createStringPropertyAssignment(redirectUriValue, value));
        }
      }
    }
    return factory.createPropertyAssignment(factory.createIdentifier('oAuth'), factory.createObjectLiteralExpression(oAuthLiterals, true));
  }

  private createOAuthFlowsObjectExpression(value: string[]) {
    return factory.createObjectLiteralExpression([
      this.createBooleanPropertyAssignment('authorizationCodeGrant', value.includes(OAuthFlowType.code)),
      this.createBooleanPropertyAssignment('implicitCodeGrant', value.includes(OAuthFlowType.implicit)),
      this.createBooleanPropertyAssignment('clientCredentials', value.includes(OAuthFlowType.client_credentials)),
    ]);
  }

  private createAuthFlowsObjectExpression(value: string[]) {
    return factory.createObjectLiteralExpression([
      this.createBooleanPropertyAssignment('adminUserPassword', value.includes(ExplicitAuthFlowsType.ALLOW_ADMIN_USER_PASSWORD_AUTH)),
      this.createBooleanPropertyAssignment('custom', value.includes(ExplicitAuthFlowsType.ALLOW_CUSTOM_AUTH)),
      this.createBooleanPropertyAssignment('userPassword', value.includes(ExplicitAuthFlowsType.ALLOW_USER_PASSWORD_AUTH)),
      this.createBooleanPropertyAssignment('userSrp', value.includes(ExplicitAuthFlowsType.ALLOW_USER_SRP_AUTH)),
    ]);
  }

  private createAdditionalAuthProvidersArray(providers: AdditionalAuthProvider[]): Expression {
    const providerElements = providers.map((provider) => {
      const properties: ts.ObjectLiteralElementLike[] = [];

      // Add authenticationType
      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('authenticationType'),
          factory.createStringLiteral(provider.authenticationType),
        ),
      );

      // Add userPoolConfig with backend.auth reference for userPoolId
      if (provider.userPoolConfig) {
        const userPoolConfigProps: ts.ObjectLiteralElementLike[] = [];

        if (provider.userPoolConfig.appIdClientRegex) {
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('appIdClientRegex'),
              factory.createStringLiteral(provider.userPoolConfig.appIdClientRegex),
            ),
          );
        }

        if (provider.userPoolConfig.awsRegion) {
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('awsRegion'),
              factory.createStringLiteral(provider.userPoolConfig.awsRegion),
            ),
          );
        }

        // Replace hardcoded userPoolId with backend.auth reference
        if (provider.userPoolConfig.userPoolId) {
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('userPoolId'),
              this.createPropertyAccessExpression(factory.createIdentifier('backend'), 'auth.resources.userPool.userPoolId'),
            ),
          );
        }

        properties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('userPoolConfig'),
            factory.createObjectLiteralExpression(userPoolConfigProps, true),
          ),
        );
      }

      // Add other configs if present
      if (provider.lambdaAuthorizerConfig) {
        properties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('lambdaAuthorizerConfig'),
            this.getOverrideValue(provider.lambdaAuthorizerConfig),
          ),
        );
      }

      if (provider.openIdConnectConfig) {
        properties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('openIdConnectConfig'),
            this.getOverrideValue(provider.openIdConnectConfig),
          ),
        );
      }

      return factory.createObjectLiteralExpression(properties, true);
    });

    return factory.createArrayLiteralExpression(providerElements, true);
  }

  // id1.id2 = `templateHead-${templateSpan}templateTail`;
  private createTemplateLiteralExpression(id1: string, id2: string, templateHead: string, templateSpan: string, templateTail: string) {
    return factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(factory.createIdentifier(id1), factory.createIdentifier(id2)),
        factory.createTemplateExpression(factory.createTemplateHead(templateHead), [
          factory.createTemplateSpan(factory.createIdentifier(templateSpan), factory.createTemplateTail(templateTail)),
        ]),
      ),
    );
  }

  private createAmplifyEnvNameLogic() {
    // Create: let AMPLIFY_GEN_1_ENV_NAME = process.env.AMPLIFY_GEN_1_ENV_NAME;
    const variableDeclaration = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier('AMPLIFY_GEN_1_ENV_NAME'),
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('process'), factory.createIdentifier('env')),
              factory.createIdentifier('AMPLIFY_GEN_1_ENV_NAME'),
            ),
          ),
        ],
        ts.NodeFlags.Let,
      ),
    );

    // Create: if (ci.isCI && !AMPLIFY_GEN_1_ENV_NAME) { ... } else if (!ci.isCI) { ... }
    const ifStatement = factory.createIfStatement(
      // Condition: ci.isCI && !AMPLIFY_GEN_1_ENV_NAME
      factory.createLogicalAnd(
        factory.createPropertyAccessExpression(factory.createIdentifier('ci'), factory.createIdentifier('isCI')),
        factory.createLogicalNot(factory.createIdentifier('AMPLIFY_GEN_1_ENV_NAME')),
      ),
      // Then block: throw new Error('...')
      factory.createBlock(
        [
          factory.createThrowStatement(
            factory.createNewExpression(factory.createIdentifier('Error'), undefined, [
              factory.createStringLiteral('AMPLIFY_GEN_1_ENV_NAME is required in CI environment'),
            ]),
          ),
        ],
        true,
      ),
      // Else block: if (!ci.isCI && !AMPLIFY_GEN_1_ENV_NAME) { ... }
      factory.createIfStatement(
        factory.createLogicalAnd(
          factory.createLogicalNot(
            factory.createPropertyAccessExpression(factory.createIdentifier('ci'), factory.createIdentifier('isCI')),
          ),
          factory.createLogicalNot(factory.createIdentifier('AMPLIFY_GEN_1_ENV_NAME')),
        ),
        // Then block: AMPLIFY_GEN_1_ENV_NAME = 'sandbox';
        factory.createBlock(
          [
            factory.createExpressionStatement(
              factory.createBinaryExpression(
                factory.createIdentifier('AMPLIFY_GEN_1_ENV_NAME'),
                factory.createToken(ts.SyntaxKind.EqualsToken),
                factory.createStringLiteral('sandbox'),
              ),
            ),
          ],
          true,
        ),
      ),
    );

    return [variableDeclaration, ifStatement];
  }

  render(renderArgs: BackendRenderParameters): NodeArray<Node> {
    const authFunctionIdentifier = factory.createIdentifier('auth');
    const storageFunctionIdentifier = factory.createIdentifier('storage');
    const dataFunctionIdentifier = factory.createIdentifier('data');
    const backendFunctionIdentifier = factory.createIdentifier('defineBackend');

    const imports = [];
    const errors = [];
    const defineBackendProperties = [];
    const nodes = [];

    // Gen 2 requires different names / casing for password rules

    const mappedPolicyType: Record<string, string> = {
      MinimumLength: 'minimumLength',
      RequireUppercase: 'requireUppercase',
      RequireLowercase: 'requireLowercase',
      RequireNumbers: 'requireNumbers',
      RequireSymbols: 'requireSymbols',
      PasswordHistorySize: 'passwordHistorySize',
      TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
    };

    // What it does: If you have auth configured:
    // Adds import: import { auth } from './auth/resource';
    // Adds auth to the backend definition

    if (renderArgs.auth) {
      imports.push(this.createImportStatement([authFunctionIdentifier], renderArgs.auth.importFrom));
      const auth = factory.createShorthandPropertyAssignment(authFunctionIdentifier);
      defineBackendProperties.push(auth);
    }

    // Same as auth

    if (renderArgs.data) {
      imports.push(this.createImportStatement([dataFunctionIdentifier], renderArgs.data.importFrom));
      const data = factory.createShorthandPropertyAssignment(dataFunctionIdentifier);
      defineBackendProperties.push(data);
    }

    // Same as auth

    if (renderArgs.storage?.hasS3Bucket || renderArgs.storage?.dynamoDB || renderArgs.storage?.dynamoTables?.length) {
      if (renderArgs.storage.hasS3Bucket) {
        imports.push(this.createImportStatement([storageFunctionIdentifier], renderArgs.storage.importFrom));
        const storage = factory.createShorthandPropertyAssignment(storageFunctionIdentifier);
        defineBackendProperties.push(storage);
      }
    }

    // Context: Gen 1 might have multiple Lambda functions
    // What it does: For each function (e.g., myFunction):
    // Adds import: import { myFunction } from './function/myFunction/resource';
    // Adds function to backend: defineBackend({ auth, myFunction, ... })

    if (renderArgs.function) {
      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      for (const [functionName, category] of functionNameCategories) {
        const functionProperty = factory.createShorthandPropertyAssignment(factory.createIdentifier(functionName));
        defineBackendProperties.push(functionProperty);
        imports.push(this.createImportStatement([factory.createIdentifier(functionName)], `./${category}/${functionName}/resource`));
      }
    }

    // Add imports for all unique functions used by REST APIs
    if (renderArgs.data?.restApis) {
      const allUniqueFunctions = new Set<string>();
      renderArgs.data.restApis.forEach((restApi) => {
        // Handle cases where uniqueFunctions might be undefined (backward compatibility)
        if (restApi.uniqueFunctions) {
          restApi.uniqueFunctions.forEach((funcName) => allUniqueFunctions.add(funcName));
        }
      });

      // Only add functions that aren't already in the main function list
      const existingFunctions = renderArgs.function?.functionNamesAndCategories || new Map();
      allUniqueFunctions.forEach((funcName) => {
        if (!existingFunctions.has(funcName)) {
          const functionProperty = factory.createShorthandPropertyAssignment(factory.createIdentifier(funcName));
          defineBackendProperties.push(functionProperty);
          imports.push(this.createImportStatement([factory.createIdentifier(funcName)], `./function/${funcName}/resource`));
        }
      });
    }

    // DynamoDB tables generation
    if (renderArgs.storage?.dynamoTables?.length) {
      // Add CDK imports
      imports.push(
        this.createImportStatement(
          [
            factory.createIdentifier('Table'),
            factory.createIdentifier('AttributeType'),
            factory.createIdentifier('BillingMode'),
            factory.createIdentifier('StreamViewType'),
          ],
          'aws-cdk-lib/aws-dynamodb',
        ),
      );

      // Create storage stack
      const stackDeclaration = factory.createVariableStatement(
        [],
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              'storageStack',
              undefined,
              undefined,
              renderArgs.storage.hasS3Bucket
                ? factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('storage')),
                    factory.createIdentifier('stack'),
                  )
                : factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
                    undefined,
                    [factory.createStringLiteral('storage')],
                  ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );
      nodes.push(stackDeclaration);

      // Generate tables
      renderArgs.storage.dynamoTables.forEach((table: DynamoDBTableDefinition) => {
        const tableProps: ts.PropertyAssignment[] = [
          factory.createPropertyAssignment(
            'partitionKey',
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment('name', factory.createStringLiteral(table.partitionKey.name)),
              factory.createPropertyAssignment(
                'type',
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('AttributeType'),
                  factory.createIdentifier(table.partitionKey.type),
                ),
              ),
            ]),
          ),
          factory.createPropertyAssignment(
            'billingMode',
            factory.createPropertyAccessExpression(
              factory.createIdentifier('BillingMode'),
              factory.createIdentifier(table.billingMode || 'PROVISIONED'),
            ),
          ),
        ];

        // Add throughput only for provisioned billing
        if (table.billingMode !== 'PAY_PER_REQUEST') {
          tableProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral(String(table.readCapacity || 5))));
          tableProps.push(
            factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral(String(table.writeCapacity || 5))),
          );
        }

        // Add stream configuration if enabled
        if (table.streamEnabled && table.streamViewType) {
          tableProps.push(
            factory.createPropertyAssignment(
              'stream',
              factory.createPropertyAccessExpression(
                factory.createIdentifier('StreamViewType'),
                factory.createIdentifier(table.streamViewType),
              ),
            ),
          );
        }

        if (table.sortKey) {
          tableProps.push(
            factory.createPropertyAssignment(
              'sortKey',
              factory.createObjectLiteralExpression([
                factory.createPropertyAssignment('name', factory.createStringLiteral(table.sortKey.name)),
                factory.createPropertyAssignment(
                  'type',
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('AttributeType'),
                    factory.createIdentifier(table.sortKey.type),
                  ),
                ),
              ]),
            ),
          );
        }

        const tableDeclaration = factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                table.tableName,
                undefined,
                undefined,
                factory.createNewExpression(factory.createIdentifier('Table'), undefined, [
                  factory.createIdentifier('storageStack'),
                  factory.createStringLiteral(table.tableName),
                  factory.createObjectLiteralExpression(tableProps),
                ]),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        );
        nodes.push(tableDeclaration);

        // Add GSIs
        table.gsis?.forEach((gsi) => {
          const gsiProps: ts.PropertyAssignment[] = [
            factory.createPropertyAssignment('indexName', factory.createStringLiteral(gsi.indexName)),
            factory.createPropertyAssignment(
              'partitionKey',
              factory.createObjectLiteralExpression([
                factory.createPropertyAssignment('name', factory.createStringLiteral(gsi.partitionKey.name)),
                factory.createPropertyAssignment(
                  'type',
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('AttributeType'),
                    factory.createIdentifier(gsi.partitionKey.type),
                  ),
                ),
              ]),
            ),
          ];

          if (gsi.sortKey) {
            gsiProps.push(
              factory.createPropertyAssignment(
                'sortKey',
                factory.createObjectLiteralExpression([
                  factory.createPropertyAssignment('name', factory.createStringLiteral(gsi.sortKey.name)),
                  factory.createPropertyAssignment(
                    'type',
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('AttributeType'),
                      factory.createIdentifier(gsi.sortKey.type),
                    ),
                  ),
                ]),
              ),
            );
          }

          gsiProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral('5')));
          gsiProps.push(factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral('5')));

          const gsiCall = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier(table.tableName),
                factory.createIdentifier('addGlobalSecondaryIndex'),
              ),
              undefined,
              [factory.createObjectLiteralExpression(gsiProps)],
            ),
          );
          nodes.push(gsiCall);
        });

        // Add Lambda permissions
        table.lambdaPermissions?.forEach((perm) => {
          const grantCall = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier(table.tableName),
                factory.createIdentifier('grantReadWriteData'),
              ),
              undefined,
              [
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('backend'),
                      factory.createIdentifier(perm.functionName),
                    ),
                    factory.createIdentifier('resources'),
                  ),
                  factory.createIdentifier('lambda'),
                ),
              ],
            ),
          );
          nodes.push(grantCall);

          const envCall = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(perm.functionName)),
                factory.createIdentifier('addEnvironment'),
              ),
              undefined,
              [
                factory.createStringLiteral(perm.envVarName),
                factory.createPropertyAccessExpression(factory.createIdentifier(table.tableName), factory.createIdentifier('tableName')),
              ],
            ),
          );
          nodes.push(envCall);
        });

        // Add DynamoDB triggers (EventSourceMapping)
        table.triggerFunctions?.forEach((functionName) => {
          // Grant stream read permissions
          const streamGrantCall = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier(table.tableName),
                factory.createIdentifier('grantStreamRead'),
              ),
              undefined,
              [
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
                    factory.createIdentifier('resources'),
                  ),
                  factory.createIdentifier('lambda'),
                ),
              ],
            ),
          );
          nodes.push(streamGrantCall);

          // Add stream ARN environment variable
          const streamEnvCall = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
                factory.createIdentifier('addEnvironment'),
              ),
              undefined,
              [
                factory.createStringLiteral(`${table.tableName.toUpperCase()}_STREAM_ARN`),
                factory.createPropertyAccessExpression(
                  factory.createIdentifier(table.tableName),
                  factory.createIdentifier('tableStreamArn'),
                ),
              ],
            ),
          );
          nodes.push(streamEnvCall);
        });
      });
    }

    // DynamoDB table escape hatch - print table names for manual migration
    if (renderArgs.storage?.dynamoDB) {
      const tableComment = factory.createEmptyStatement();
      ts.addSyntheticLeadingComment(
        tableComment,
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` TODO: Migrate DynamoDB table '${renderArgs.storage.dynamoDB}' manually using CDK constructs`,
        true,
      );
      nodes.push(tableComment);
    }

    // Adds core import: import { defineBackend } from '@aws-amplify/backend';

    imports.push(this.createImportStatement([backendFunctionIdentifier], '@aws-amplify/backend'));

    // Add CDK imports for REST API if needed
    if (renderArgs.data?.restApis && renderArgs.function) {
      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      const hasRestApis = renderArgs.data.restApis.some((restApi) => functionNameCategories.has(restApi.functionName));

      if (hasRestApis) {
        imports.push(
          this.createImportStatement(
            [factory.createIdentifier('HttpApi'), factory.createIdentifier('HttpMethod'), factory.createIdentifier('CorsHttpMethod')],
            'aws-cdk-lib/aws-apigatewayv2',
          ),
        );
        imports.push(
          this.createImportStatement([factory.createIdentifier('HttpLambdaIntegration')], 'aws-cdk-lib/aws-apigatewayv2-integrations'),
        );

        // Check which auth types are used to conditionally import authorizers
        const hasPrivateAuth = renderArgs.data.restApis.some((restApi) => restApi.paths.some((path) => path.authType === 'private'));
        const hasProtectedAuth = renderArgs.data.restApis.some((restApi) => restApi.paths.some((path) => path.authType === 'protected'));
        const hasUserPoolGroups = renderArgs.data.restApis.some((restApi) =>
          restApi.paths.some((path) => path.userPoolGroups && path.userPoolGroups.length > 0),
        );

        // Only import authorizers that are actually needed
        const authorizerImports = [];
        if (hasPrivateAuth) {
          authorizerImports.push(factory.createIdentifier('HttpIamAuthorizer'));
        }
        if (hasProtectedAuth && renderArgs.auth) {
          authorizerImports.push(factory.createIdentifier('HttpUserPoolAuthorizer'));
        }
        if (hasUserPoolGroups && renderArgs.auth) {
          authorizerImports.push(factory.createIdentifier('HttpUserPoolAuthorizer'));
        }

        if (authorizerImports.length > 0) {
          imports.push(this.createImportStatement(authorizerImports, 'aws-cdk-lib/aws-apigatewayv2-authorizers'));
        }

        imports.push(
          this.createImportStatement(
            [factory.createIdentifier('Policy'), factory.createIdentifier('PolicyStatement')],
            'aws-cdk-lib/aws-iam',
          ),
        );
        imports.push(this.createImportStatement([factory.createIdentifier('Stack')], 'aws-cdk-lib'));
      }
    }

    if (renderArgs.unsupportedCategories) {
      const categories = renderArgs.unsupportedCategories;

      for (const [key, value] of categories) {
        errors.push(
          factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
            factory.createStringLiteral(`Category ${key} is unsupported, please follow ${value}`),
          ]),
        );
      }
    }

    // Custom resources are now handled by BackendUpdater.updateBackendFile() in command-handlers.ts
    // which is called after the initial backend.ts is generated. This ensures the correct Gen2 pattern
    // is used (importing from ./custom/${resourceName}/resource and using backend.createStack())

    //const envNameStatements = this.createAmplifyEnvNameLogic();
    //errors.push(...envNameStatements);

    // Creates the main line: const backend = defineBackend({ auth, data, storage })

    const callBackendFn = this.defineBackendCall(backendFunctionIdentifier, defineBackendProperties);
    const backendVariable = factory.createVariableDeclaration('backend', undefined, undefined, callBackendFn);
    const backendStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([backendVariable], ts.NodeFlags.Const),
    );

    // CDK OVERRIDES
    // When you have advanced user pool settings AND you're creating new auth (not importing existing)
    if (renderArgs.auth?.userPoolOverrides && !renderArgs?.auth?.referenceAuth) {
      // Generates const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
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
          // Handle everything else
          // This is where username attributes get handled!
          // Input: usernameAttributes: ['username']
          // Generates: cfnUserPool.usernameAttributes = ['username'];
          nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPool'), overridePath, value));
        }
      }
      // Generates: cfnUserPool.policies = { passwordPolicy: { minimumLength: 8 } };
      nodes.push(
        this.setPropertyValue(
          factory.createIdentifier('cfnUserPool'),
          'policies',
          policies as number | string | boolean | string[] | object,
        ),
      );
    }

    // Identity pool overrides
    if (renderArgs.auth?.guestLogin === false || (renderArgs.auth?.identityPoolName && !renderArgs?.auth?.referenceAuth)) {
      const cfnIdentityPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnIdentityPool', 'auth.resources.cfnResources.cfnIdentityPool'),
      );
      nodes.push(cfnIdentityPoolVariableStatement);
      if (renderArgs.auth?.guestLogin === false) {
        nodes.push(this.setPropertyValue(factory.createIdentifier('cfnIdentityPool'), 'allowUnauthenticatedIdentities', false));
      }
    }

    // User pool client overrides
    if (
      (renderArgs.auth?.oAuthFlows || renderArgs.auth?.readAttributes || renderArgs.auth?.writeAttributes) &&
      !renderArgs?.auth?.referenceAuth
    ) {
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

    if (renderArgs.auth?.writeAttributes && !renderArgs?.auth?.referenceAuth) {
      nodes.push(
        this.setPropertyValue(
          factory.createIdentifier('cfnUserPoolClient'),
          'writeAttributes',
          renderArgs.auth?.writeAttributes as string[],
        ),
      );
    }

    // Since Gen2 only supports 1 user pool client by default, we need to add CDK overrides for the additional user pool client from Gen1
    // If Gen 1 had separate mobile and web clients, Gen 2 needs to recreate that setup.
    if (renderArgs.auth?.userPoolClient) {
      const userPoolVariableStatement = this.createVariableStatement(this.createVariableDeclaration('userPool', 'auth.resources.userPool'));
      nodes.push(userPoolVariableStatement);

      // Check if we need the userPoolClient constant (only if there are SupportedIdentityProviders)
      // See call stack for createProviderSetupCode() function.
      const needsUserPoolClientConstant =
        renderArgs.auth.userPoolClient.SupportedIdentityProviders && renderArgs.auth.userPoolClient.SupportedIdentityProviders.length > 0;

      nodes.push(this.createUserPoolClientAssignment(renderArgs.auth?.userPoolClient, imports, needsUserPoolClientConstant));
    }

    // Stores basic S3 bucket info
    // const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
    // s3Bucket.bucketName = `myapp-storage-${AMPLIFY_GEN_1_ENV_NAME}`;

    if (renderArgs.storage && renderArgs.storage.hasS3Bucket) {
      assert(renderArgs.storage.bucketName);
      const cfnStorageVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('s3Bucket', 'storage.resources.cfnResources.cfnBucket'),
      );
      nodes.push(cfnStorageVariableStatement);

      // Add comments as synthetic leading comments
      const bucketNameComment1 = factory.createNotEmittedStatement(factory.createStringLiteral(''));
      ts.addSyntheticLeadingComment(bucketNameComment1, ts.SyntaxKind.SingleLineCommentTrivia, ` Use this bucket name post refactor`, true);

      const bucketNameComment2 = factory.createNotEmittedStatement(factory.createStringLiteral(''));
      ts.addSyntheticLeadingComment(
        bucketNameComment2,
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` s3Bucket.bucketName = '${renderArgs.storage.bucketName}';`,
        true,
      );
      nodes.push(bucketNameComment1, bucketNameComment2);
    }

    // Features that Gen1 just doesn't support for storage
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
              [this.createStringPropertyAssignment('accelerationStatus', renderArgs.storage.accelerateConfiguration)],
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
              [this.createStringPropertyAssignment('status', renderArgs.storage.versionConfiguration)],
              false,
            ),
          ),
        );
        nodes.push(versionConfigAssignment);
      }

      if (renderArgs.storage?.bucketEncryptionAlgorithm) {
        const serverSideEncryptionByDefaultMap = new Map<string, string>();
        serverSideEncryptionByDefaultMap.set('SSEAlgorithm', 'sseAlgorithm');
        serverSideEncryptionByDefaultMap.set('KMSMasterKeyID', 'kmsMasterKeyId');
        serverSideEncryptionByDefaultMap.set('bucketKeyEnabled', 'bucketKeyEnabled');
        serverSideEncryptionByDefaultMap.set('serverSideEncryptionByDefault', 'serverSideEncryptionByDefault');

        const bucketEncryptionAssignment = factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(factory.createIdentifier('s3Bucket'), factory.createIdentifier('bucketEncryption')),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('serverSideEncryptionConfiguration'),
                  factory.createArrayLiteralExpression(
                    [this.createNestedObjectExpression(renderArgs.storage.bucketEncryptionAlgorithm, serverSideEncryptionByDefaultMap)],
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
    }

    // I DONT UNDERSTAND THIS PART YET
    if (
      renderArgs.auth?.userPoolClient &&
      renderArgs.auth.userPoolClient.SupportedIdentityProviders &&
      renderArgs.auth.userPoolClient.SupportedIdentityProviders.length > 0
    ) {
      const idpStatements = this.createProviderSetupCode();
      nodes.push(...idpStatements);

      // Gen1 doesn't manage UserPoolDomains in CFN while Gen2 creates a default one for oauth apps.
      // This causes an invalid domain request error when updating Gen2 post stack refactor.
      // We are adding a commented line to remove the domain from Gen2 CDK. This will be
      // uncommented by users post refactor (instructions will be in README.md).
      // backend.auth.resources.userPool.node.tryRemoveChild('UserPoolDomain');
      const userPoolDomainRemovalStatementCommented = factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('// backend.auth.resources.userPool'),
              factory.createIdentifier('node'),
            ),
            factory.createIdentifier('tryRemoveChild'),
          ),
          undefined,
          [factory.createStringLiteral('UserPoolDomain')],
        ),
      );
      nodes.push(userPoolDomainRemovalStatementCommented);
    }

    // Additional auth providers for GraphQL API
    if (renderArgs.data?.additionalAuthProviders && renderArgs.auth) {
      const cfnGraphqlApiVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnGraphqlApi', 'data.resources.cfnResources.cfnGraphqlApi'),
      );
      nodes.push(cfnGraphqlApiVariableStatement);

      const additionalAuthProviders = this.createAdditionalAuthProvidersArray(renderArgs.data.additionalAuthProviders);
      nodes.push(
        factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('cfnGraphqlApi'),
              factory.createIdentifier('additionalAuthenticationProviders'),
            ),
            additionalAuthProviders,
          ),
        ),
      );
    }

    // Function name escape hatch - set function names with branch suffix
    if (renderArgs.function) {
      const branchNameStatement = factory.createVariableStatement(
        [],
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              'branchName',
              undefined,
              undefined,
              factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );
      nodes.push(branchNameStatement);

      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      for (const [functionName] of functionNameCategories) {
        nodes.push(
          factory.createExpressionStatement(
            factory.createBinaryExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
                      factory.createIdentifier('resources'),
                    ),
                    factory.createIdentifier('cfnResources'),
                  ),
                  factory.createIdentifier('cfnFunction'),
                ),
                factory.createIdentifier('functionName'),
              ),
              factory.createToken(ts.SyntaxKind.EqualsToken),
              factory.createTemplateExpression(factory.createTemplateHead(`${functionName}-`), [
                factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
              ]),
            ),
          ),
        );
      }
    }

    // Generate REST API infrastructure using CDK constructs
    // This replaces Gen1's declarative API Gateway config with Gen2's imperative CDK code
    if (renderArgs.data?.restApis && renderArgs.function) {
      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      const validRestApis = renderArgs.data.restApis.filter((restApi) => functionNameCategories.has(restApi.functionName));

      if (validRestApis.length > 0) {
        // Create dedicated CDK stack for API resources
        const apiStackStatement = factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                'apiStack',
                undefined,
                undefined,
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
                  undefined,
                  [factory.createStringLiteral('api-stack')],
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        );
        nodes.push(apiStackStatement);

        // Check which auth types are used to conditionally create authorizers
        const hasPrivateAuth = validRestApis.some((restApi) => restApi.paths.some((path) => path.authType === 'private'));
        const hasProtectedAuth = validRestApis.some((restApi) => restApi.paths.some((path) => path.authType === 'protected'));
        const hasUserPoolGroups = validRestApis.some((restApi) =>
          restApi.paths.some((path) => path.userPoolGroups && path.userPoolGroups.length > 0),
        );

        // Create IAM authorizer only if private endpoints exist
        if (hasPrivateAuth) {
          const iamAuthorizerStatement = factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  'iamAuthorizer',
                  undefined,
                  undefined,
                  factory.createNewExpression(factory.createIdentifier('HttpIamAuthorizer'), undefined, []),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          );
          nodes.push(iamAuthorizerStatement);
        }

        // Create Cognito User Pool authorizer only if protected endpoints exist and auth is configured
        if (hasProtectedAuth && renderArgs.auth) {
          const userPoolAuthorizerStatement = factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  'userPoolAuthorizer',
                  undefined,
                  undefined,
                  factory.createNewExpression(factory.createIdentifier('HttpUserPoolAuthorizer'), undefined, [
                    factory.createStringLiteral('userPoolAuth'),
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('backend.auth.resources'),
                      factory.createIdentifier('userPool'),
                    ),
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        factory.createIdentifier('userPoolClients'),
                        factory.createArrayLiteralExpression([
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier('backend.auth.resources'),
                            factory.createIdentifier('userPoolClient'),
                          ),
                        ]),
                      ),
                    ]),
                  ]),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          );
          nodes.push(userPoolAuthorizerStatement);
        }

        // Create User Pool Group authorizers for each unique group
        if (hasUserPoolGroups && renderArgs.auth) {
          const allGroups = new Set<string>();
          validRestApis.forEach((restApi) => {
            restApi.paths.forEach((path) => {
              if (path.userPoolGroups) {
                path.userPoolGroups.forEach((group) => allGroups.add(group));
              }
            });
          });

          allGroups.forEach((groupName) => {
            const groupAuthorizerStatement = factory.createVariableStatement(
              [],
              factory.createVariableDeclarationList(
                [
                  factory.createVariableDeclaration(
                    `${groupName}Authorizer`,
                    undefined,
                    undefined,
                    factory.createNewExpression(factory.createIdentifier('HttpUserPoolAuthorizer'), undefined, [
                      factory.createStringLiteral(`${groupName}Auth`),
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier('backend.auth.resources'),
                        factory.createIdentifier('userPool'),
                      ),
                      factory.createObjectLiteralExpression([
                        factory.createPropertyAssignment(
                          factory.createIdentifier('userPoolClients'),
                          factory.createArrayLiteralExpression([
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier('backend.auth.resources'),
                              factory.createIdentifier('userPoolClient'),
                            ),
                          ]),
                        ),
                        factory.createPropertyAssignment(
                          factory.createIdentifier('identitySource'),
                          factory.createArrayLiteralExpression([factory.createStringLiteral('$request.header.Authorization')]),
                        ),
                      ]),
                    ]),
                  ),
                ],
                ts.NodeFlags.Const,
              ),
            );
            nodes.push(groupAuthorizerStatement);
          });
        }

        // Create separate HttpApi for each Gen1 REST API
        const httpApiVariables: string[] = [];
        validRestApis.forEach((restApi: RestApiDefinition, index: number) => {
          const httpApiVarName = `httpApi${index > 0 ? index + 1 : ''}`;
          httpApiVariables.push(httpApiVarName);

          const httpApiStatement = factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  httpApiVarName,
                  undefined,
                  undefined,
                  factory.createNewExpression(factory.createIdentifier('HttpApi'), undefined, [
                    factory.createIdentifier('apiStack'),
                    factory.createStringLiteral(`HttpApi${index > 0 ? index + 1 : ''}`),
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        factory.createIdentifier('apiName'),
                        factory.createTemplateExpression(factory.createTemplateHead(`${restApi.apiName}-`), [
                          factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
                        ]),
                      ),
                      factory.createPropertyAssignment(factory.createIdentifier('createDefaultStage'), factory.createTrue()),
                      // Add CORS configuration - use Gen1 settings if available, otherwise secure defaults
                      factory.createPropertyAssignment(
                        factory.createIdentifier('corsPreflight'),
                        factory.createObjectLiteralExpression([
                          factory.createPropertyAssignment(
                            factory.createIdentifier('allowMethods'),
                            factory.createArrayLiteralExpression(
                              (restApi.corsConfiguration?.allowMethods || ['GET', 'POST', 'PUT', 'DELETE']).map((method) =>
                                factory.createPropertyAccessExpression(
                                  factory.createIdentifier('CorsHttpMethod'),
                                  factory.createIdentifier(method.toUpperCase()),
                                ),
                              ),
                            ),
                          ),
                          factory.createPropertyAssignment(
                            factory.createIdentifier('allowOrigins'),
                            factory.createArrayLiteralExpression(
                              (restApi.corsConfiguration?.allowOrigins || ['*']).map((origin) => factory.createStringLiteral(origin)),
                            ),
                          ),
                          factory.createPropertyAssignment(
                            factory.createIdentifier('allowHeaders'),
                            factory.createArrayLiteralExpression(
                              (restApi.corsConfiguration?.allowHeaders || ['content-type', 'authorization']).map((header) =>
                                factory.createStringLiteral(header),
                              ),
                            ),
                          ),
                        ]),
                      ),
                    ]),
                  ]),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          );
          nodes.push(httpApiStatement);

          // Generate routes for this specific REST API's paths
          // Each path maps to the correct Lambda function with proper authorization
          restApi.paths.forEach((pathConfig) => {
            // Use the path-specific Lambda function, not the API-level function
            const pathFunctionName = pathConfig.lambdaFunction || restApi.functionName;

            // Skip if the function doesn't exist in the migration
            if (!functionNameCategories.has(pathFunctionName)) {
              return;
            }

            const routeConfig: ts.ObjectLiteralElementLike[] = [
              factory.createPropertyAssignment(factory.createIdentifier('path'), factory.createStringLiteral(pathConfig.path)),
              // Only include HTTP methods that the Gen1 function actually supports
              factory.createPropertyAssignment(
                factory.createIdentifier('methods'),
                factory.createArrayLiteralExpression(
                  pathConfig.methods.map((method: string) =>
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('HttpMethod'),
                      factory.createIdentifier(method.toUpperCase()),
                    ),
                  ),
                ),
              ),
              // Create unique integration name: {functionName}Integration
              factory.createPropertyAssignment(
                factory.createIdentifier('integration'),
                factory.createNewExpression(factory.createIdentifier('HttpLambdaIntegration'), undefined, [
                  factory.createStringLiteral(`${pathFunctionName}Integration`),
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(`backend.${pathFunctionName}.resources`),
                    factory.createIdentifier('lambda'),
                  ),
                ]),
              ),
            ];

            // Map Gen1 permission settings to Gen2 authorizers:
            // 'private' -> iamAuthorizer, 'protected' -> userPoolAuthorizer, 'open' -> undefined
            // User Pool Groups -> create separate routes for each group
            //
            // Why separate routes? API Gateway v2 only supports ONE authorizer per route.
            // Gen1: { path: '/admin', userPoolGroups: ['AdminUsers', 'SuperAdmins'] }
            // Gen2: Must create separate routes with same path but different authorizers
            //       API Gateway tries each route until one authorizer succeeds (OR logic)
            if (pathConfig.userPoolGroups && pathConfig.userPoolGroups.length > 0) {
              // Create separate route for each group (Gen1 supports multiple groups per path)
              pathConfig.userPoolGroups.forEach((groupName) => {
                const groupRouteConfig = [...routeConfig];
                groupRouteConfig.push(
                  factory.createPropertyAssignment(
                    factory.createIdentifier('authorizer'),
                    factory.createIdentifier(`${groupName}Authorizer`),
                  ),
                );

                const addGroupRouteStatement = factory.createExpressionStatement(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                    undefined,
                    [factory.createObjectLiteralExpression(groupRouteConfig)],
                  ),
                );
                nodes.push(addGroupRouteStatement);
              });
            } else if (pathConfig.authType === 'private') {
              routeConfig.push(
                factory.createPropertyAssignment(factory.createIdentifier('authorizer'), factory.createIdentifier('iamAuthorizer')),
              );

              const addRoutesStatement = factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                  undefined,
                  [factory.createObjectLiteralExpression(routeConfig)],
                ),
              );
              nodes.push(addRoutesStatement);
            } else if (pathConfig.authType === 'protected') {
              routeConfig.push(
                factory.createPropertyAssignment(factory.createIdentifier('authorizer'), factory.createIdentifier('userPoolAuthorizer')),
              );

              const addRoutesStatement = factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                  undefined,
                  [factory.createObjectLiteralExpression(routeConfig)],
                ),
              );
              nodes.push(addRoutesStatement);
            } else {
              // Open access - no authorizer
              const addRoutesStatement = factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                  undefined,
                  [factory.createObjectLiteralExpression(routeConfig)],
                ),
              );
              nodes.push(addRoutesStatement);
            }
            // Note: 'open' access requires no authorizer property

            // Generate automatic proxy catch-all routes to match Gen1 behavior
            //
            // Why this is needed:
            // Gen1 automatically creates TWO routes for every path:
            //   1. /items (exact match for the main resource)
            //   2. /items/{proxy+} (catch-all for sub-resources like /items/123, /items/abc/def)
            //
            // Without the proxy route:
            //   GET /items → ✅ Works (matches exact route)
            //   GET /items/123 → ❌ 404 Not Found (no matching route)
            //
            // With the proxy route:
            //   GET /items → ✅ Works (matches exact route)
            //   GET /items/123 → ✅ Works (matches proxy route, proxy="123")
            //   POST /items/123/comments → ✅ Works (matches proxy route, proxy="123/comments")
            //
            // The Lambda function receives the full path and can handle routing internally
            // using serverless-express or similar frameworks.
            //
            const proxyRouteConfig: ts.ObjectLiteralElementLike[] = [
              factory.createPropertyAssignment(
                factory.createIdentifier('path'),
                factory.createStringLiteral(`${pathConfig.path}/{proxy+}`),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('methods'),
                factory.createArrayLiteralExpression([
                  factory.createPropertyAccessExpression(factory.createIdentifier('HttpMethod'), factory.createIdentifier('ANY')),
                ]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('integration'),
                factory.createNewExpression(factory.createIdentifier('HttpLambdaIntegration'), undefined, [
                  factory.createStringLiteral(`${pathFunctionName}ProxyIntegration`),
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(`backend.${pathFunctionName}.resources`),
                    factory.createIdentifier('lambda'),
                  ),
                ]),
              ),
            ];

            // Apply same authorization to proxy route
            if (pathConfig.userPoolGroups && pathConfig.userPoolGroups.length > 0) {
              pathConfig.userPoolGroups.forEach((groupName) => {
                const groupProxyRouteConfig = [...proxyRouteConfig];
                groupProxyRouteConfig.push(
                  factory.createPropertyAssignment(
                    factory.createIdentifier('authorizer'),
                    factory.createIdentifier(`${groupName}Authorizer`),
                  ),
                );

                const addGroupProxyRouteStatement = factory.createExpressionStatement(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                    undefined,
                    [factory.createObjectLiteralExpression(groupProxyRouteConfig)],
                  ),
                );
                nodes.push(addGroupProxyRouteStatement);
              });
            } else if (pathConfig.authType === 'private') {
              proxyRouteConfig.push(
                factory.createPropertyAssignment(factory.createIdentifier('authorizer'), factory.createIdentifier('iamAuthorizer')),
              );

              const addProxyRoutesStatement = factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                  undefined,
                  [factory.createObjectLiteralExpression(proxyRouteConfig)],
                ),
              );
              nodes.push(addProxyRoutesStatement);
            } else if (pathConfig.authType === 'protected') {
              proxyRouteConfig.push(
                factory.createPropertyAssignment(factory.createIdentifier('authorizer'), factory.createIdentifier('userPoolAuthorizer')),
              );

              const addProxyRoutesStatement = factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                  undefined,
                  [factory.createObjectLiteralExpression(proxyRouteConfig)],
                ),
              );
              nodes.push(addProxyRoutesStatement);
            } else {
              // Open access - no authorizer
              const addProxyRoutesStatement = factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVarName), factory.createIdentifier('addRoutes')),
                  undefined,
                  [factory.createObjectLiteralExpression(proxyRouteConfig)],
                ),
              );
              nodes.push(addProxyRoutesStatement);
            }
          });
        });

        // Create IAM policy covering all HttpApis for Cognito Identity Pool access
        if (renderArgs.auth) {
          // Generate ARN resources for all HttpApis with wildcard paths
          const policyResources = httpApiVariables.map((httpApiVar) =>
            factory.createTemplateExpression(factory.createTemplateHead(''), [
              factory.createTemplateSpan(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(httpApiVar),
                    factory.createIdentifier('arnForExecuteApi'),
                  ),
                  undefined,
                  [factory.createStringLiteral('*'), factory.createStringLiteral('/*')],
                ),
                factory.createTemplateTail(''),
              ),
            ]),
          );

          const apiPolicyStatement = factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  'apiPolicy',
                  undefined,
                  undefined,
                  factory.createNewExpression(factory.createIdentifier('Policy'), undefined, [
                    factory.createIdentifier('apiStack'),
                    factory.createStringLiteral('ApiPolicy'),
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        factory.createIdentifier('statements'),
                        factory.createArrayLiteralExpression([
                          factory.createNewExpression(factory.createIdentifier('PolicyStatement'), undefined, [
                            factory.createObjectLiteralExpression([
                              factory.createPropertyAssignment(
                                factory.createIdentifier('actions'),
                                factory.createArrayLiteralExpression([factory.createStringLiteral('execute-api:Invoke')]),
                              ),
                              factory.createPropertyAssignment(
                                factory.createIdentifier('resources'),
                                factory.createArrayLiteralExpression(policyResources),
                              ),
                            ]),
                          ]),
                        ]),
                      ),
                    ]),
                  ]),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          );
          nodes.push(apiPolicyStatement);

          // Attach policy to both authenticated and unauthenticated IAM roles
          // This enables Cognito Identity Pool users to call all API endpoints
          const attachAuthenticatedPolicyStatement = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('backend.auth.resources.authenticatedUserIamRole'),
                factory.createIdentifier('attachInlinePolicy'),
              ),
              undefined,
              [factory.createIdentifier('apiPolicy')],
            ),
          );
          nodes.push(attachAuthenticatedPolicyStatement);

          const attachUnauthenticatedPolicyStatement = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('backend.auth.resources.unauthenticatedUserIamRole'),
                factory.createIdentifier('attachInlinePolicy'),
              ),
              undefined,
              [factory.createIdentifier('apiPolicy')],
            ),
          );
          nodes.push(attachUnauthenticatedPolicyStatement);
        }

        // Generate backend output configuration for all HttpApis
        // Creates amplify_outputs.json entries for client-side API configuration
        const apiOutputs = httpApiVariables.map((httpApiVar, index) => {
          const restApi = validRestApis[index];
          return factory.createPropertyAssignment(
            factory.createComputedPropertyName(
              factory.createNonNullExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVar), factory.createIdentifier('httpApiName')),
              ),
            ),
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                factory.createIdentifier('endpoint'),
                factory.createPropertyAccessExpression(factory.createIdentifier(httpApiVar), factory.createIdentifier('url')),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('region'),
                factory.createPropertyAccessExpression(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('Stack'), factory.createIdentifier('of')),
                    undefined,
                    [factory.createIdentifier(httpApiVar)],
                  ),
                  factory.createIdentifier('region'),
                ),
              ),
            ]),
          );
        });

        const addOutputStatement = factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('addOutput')),
            undefined,
            [
              factory.createObjectLiteralExpression([
                factory.createPropertyAssignment(
                  factory.createIdentifier('api'),
                  factory.createObjectLiteralExpression([
                    factory.createPropertyAssignment(factory.createIdentifier('REST'), factory.createObjectLiteralExpression(apiOutputs)),
                  ]),
                ),
              ]),
            ],
          ),
        );
        nodes.push(addOutputStatement);
      }
    }

    // returns backend.ts file
    return factory.createNodeArray([...imports, newLineIdentifier, ...errors, newLineIdentifier, backendStatement, ...nodes], true);
  }
}
