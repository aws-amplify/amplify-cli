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
import { ExplicitAuthFlowsType, OAuthFlowType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import assert from 'assert';
import { newLineIdentifier } from '../ts_factory_utils';

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
    referenceAuth?: ReferenceAuth;
    userPoolClient?: UserPoolClientType;
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

  private createUserPoolClientAssignment(userPoolClient: UserPoolClientType, imports: ts.ImportDeclaration[]) {
    const userPoolClientAttributesMap = new Map<string, string>();
    userPoolClientAttributesMap.set('ClientName', 'userPoolClientName');
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

    const userPoolClientDeclaration = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier('userPoolClient'),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('addClient')),
              undefined,
              [
                factory.createStringLiteral('NativeAppClient'),
                this.createNestedObjectExpression(userPoolClient, userPoolClientAttributesMap),
              ],
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
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

    return userPoolClientDeclaration;
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

  private createDynamoDBEscapeHatch(): ts.Statement[] {
    // changing cloudformation template to match deletionprotection: false setting in dynamoDB tables
    const comment = factory.createExpressionStatement(
      factory.createIdentifier('// changing cloudformation template to match deletionprotection: false setting in dynamoDB tables'),
    );

    // const cfnResources = backend.data.node.findAll().filter(c => CfnResource.isCfnResource(c));
    const cfnResourcesDeclaration = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier('cfnResources'),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
                      factory.createIdentifier('node'),
                    ),
                    factory.createIdentifier('findAll'),
                  ),
                  undefined,
                  [],
                ),
                factory.createIdentifier('filter'),
              ),
              undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('c'))],
                  undefined,
                  factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('CfnResource'),
                      factory.createIdentifier('isCfnResource'),
                    ),
                    undefined,
                    [factory.createIdentifier('c')],
                  ),
                ),
              ],
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

    // for (const resource of cfnResources) { ... }
    const forOfStatement = factory.createForOfStatement(
      undefined,
      factory.createVariableDeclarationList([factory.createVariableDeclaration(factory.createIdentifier('resource'))], ts.NodeFlags.Const),
      factory.createIdentifier('cfnResources'),
      factory.createBlock(
        [
          factory.createIfStatement(
            factory.createBinaryExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('resource'), factory.createIdentifier('cfnResourceType')),
              factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
              factory.createStringLiteral('Custom::ImportedAmplifyDynamoDBTable'),
            ),
            factory.createBlock(
              [
                factory.createExpressionStatement(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('resource'),
                      factory.createIdentifier('addPropertyOverride'),
                    ),
                    undefined,
                    [factory.createStringLiteral('deletionProtectionEnabled'), factory.createFalse()],
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

    return [comment, cfnResourcesDeclaration, forOfStatement];
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

    // What it does: If you have auth, storage, or custom resources, adds:
    // import { RemovalPolicy, Tags } from 'aws-cdk-lib';

    if (renderArgs.auth || renderArgs.storage?.hasS3Bucket || renderArgs.customResources) {
      imports.push(
        this.createImportStatement([factory.createIdentifier('RemovalPolicy'), factory.createIdentifier('Tags')], 'aws-cdk-lib'),
      );
    }

    // Add CfnResource import for DynamoDB escape hatch
    if (renderArgs.data) {
      imports.push(this.createImportStatement([factory.createIdentifier('CfnResource')], 'aws-cdk-lib'));
    }

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

    if (renderArgs.storage?.hasS3Bucket) {
      imports.push(this.createImportStatement([storageFunctionIdentifier], renderArgs.storage.importFrom));
      const storage = factory.createShorthandPropertyAssignment(storageFunctionIdentifier);
      defineBackendProperties.push(storage);
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

    // Dynamo table cannot be migrated

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

    // Adds core import: import { defineBackend } from '@aws-amplify/backend';

    imports.push(this.createImportStatement([backendFunctionIdentifier], '@aws-amplify/backend'));

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

    if (renderArgs.customResources) {
      for (const [resourceName, className] of renderArgs.customResources) {
        const importStatement = factory.createImportDeclaration(
          undefined,
          factory.createImportClause(
            false,
            undefined,
            factory.createNamedImports([
              factory.createImportSpecifier(false, factory.createIdentifier(`${className}`), factory.createIdentifier(`${resourceName}`)),
            ]),
          ),
          factory.createStringLiteral(`./custom/${resourceName}/cdk-stack`),
          undefined,
        );

        imports.push(importStatement);

        const customResourceExpression = factory.createNewExpression(factory.createIdentifier(`${resourceName}`), undefined, [
          factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('stack')),
          factory.createStringLiteral(`${resourceName}`),
          factory.createIdentifier('undefined'),
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(factory.createIdentifier('category'), factory.createStringLiteral('custom')),
              factory.createPropertyAssignment(factory.createIdentifier('resourceName'), factory.createStringLiteral(`${resourceName}`)),
            ],
            true,
          ),
        ]);

        nodes.push(factory.createExpressionStatement(customResourceExpression));
      }
    }

    // Adds CI detection: import ci from 'ci-info';

    const ciInfoImportStatement = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, factory.createIdentifier('ci'), undefined),
      factory.createStringLiteral('ci-info'),
    );

    // Creates environment name logic (sandbox vs production)

    imports.push(ciInfoImportStatement);
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
      nodes.push(this.createUserPoolClientAssignment(renderArgs.auth?.userPoolClient, imports));
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

      imports.push(
        factory.createImportDeclaration(
          undefined,
          factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier('s3'))),
          factory.createStringLiteral('aws-cdk-lib/aws-s3'),
        ),
      );
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

    // Add DynamoDB escape hatch for deletion protection
    if (renderArgs.data) {
      const dynamoDBEscapeHatch = this.createDynamoDBEscapeHatch();
      nodes.push(...dynamoDBEscapeHatch);
    }

    // Add a tag commented out to force a deployment post refactor
    // Tags.of(backend.stack).add('gen1-migrated-app', 'true')
    if (renderArgs.auth || renderArgs.storage?.hasS3Bucket || renderArgs.customResources) {
      const tagAssignment = factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createCallExpression(factory.createIdentifier('// Tags.of'), undefined, [factory.createIdentifier('backend.stack')]),
            factory.createIdentifier('add'),
          ),
          undefined,
          [factory.createStringLiteral('gen1-migrated-app'), factory.createStringLiteral('true')],
        ),
      );
      nodes.push(tagAssignment);
    }

    // returns backend.ts file
    return factory.createNodeArray([...imports, newLineIdentifier, ...errors, newLineIdentifier, backendStatement, ...nodes], true);
  }
}
