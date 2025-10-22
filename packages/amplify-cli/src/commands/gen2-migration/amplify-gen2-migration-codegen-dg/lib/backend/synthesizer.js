'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.BackendSynthesizer = void 0;
const typescript_1 = __importDefault(require('typescript'));
const client_cognito_identity_provider_1 = require('@aws-sdk/client-cognito-identity-provider');
const assert_1 = __importDefault(require('assert'));
const ts_factory_utils_1 = require('../ts_factory_utils');
const factory = typescript_1.default.factory;
const amplifyGen1EnvName = 'AMPLIFY_GEN_1_ENV_NAME';
class BackendSynthesizer {
  constructor() {
    this.importDurationFlag = false;
    this.oAuthFlag = false;
    this.readWriteAttributeFlag = false;
    this.supportedIdentityProviderFlag = false;
  }
  createPropertyAccessExpression(objectIdentifier, propertyPath) {
    const parts = propertyPath.split('.');
    let expression = objectIdentifier;
    for (let i = 0; i < parts.length; i++) {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(parts[i]));
    }
    return expression;
  }
  createVariableDeclaration(identifierName, propertyPath) {
    const identifier = factory.createIdentifier(identifierName);
    const propertyAccessExpression = this.createPropertyAccessExpression(factory.createIdentifier('backend'), propertyPath);
    return factory.createVariableDeclaration(identifier, undefined, undefined, propertyAccessExpression);
  }
  createVariableStatement(variableDeclaration) {
    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([variableDeclaration], typescript_1.default.NodeFlags.Const),
    );
  }
  createImportStatement(identifiers, backendPackageName) {
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
  defineBackendCall(backendFunctionIdentifier, properties) {
    const backendFunctionArgs = factory.createObjectLiteralExpression(properties, true);
    return factory.createCallExpression(backendFunctionIdentifier, undefined, [backendFunctionArgs]);
  }
  setPropertyValue(objectIdentifier, propertyPath, value) {
    const propertyAccessExpression = this.createPropertyAccessExpression(objectIdentifier, propertyPath);
    const overrideValue = this.getOverrideValue(value);
    return factory.createExpressionStatement(factory.createAssignment(propertyAccessExpression, overrideValue));
  }
  getOverrideValue(value) {
    if (typeof value === 'number') {
      return factory.createNumericLiteral(value);
    } else if (typeof value === 'string') {
      return factory.createStringLiteral(value);
    } else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return factory.createArrayLiteralExpression(value.map((item) => factory.createStringLiteral(item)));
    } else if (typeof value === 'boolean') {
      return value ? factory.createTrue() : factory.createFalse();
    } else if (typeof value === 'object' && value !== null) {
      const properties = [];
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
  createBooleanPropertyAssignment(identifier, condition) {
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), condition ? factory.createTrue() : factory.createFalse());
  }
  createListPropertyAssignment(identifier, listAttribute) {
    return factory.createPropertyAssignment(
      factory.createIdentifier(identifier),
      factory.createArrayLiteralExpression(listAttribute.map((attribute) => factory.createStringLiteral(attribute))),
    );
  }
  createEnumListPropertyAssignment(identifier, enumIdentifier, listAttribute) {
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
  createNumericPropertyAssignment(identifier, numericLiteral) {
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), factory.createNumericLiteral(numericLiteral));
  }
  createDurationPropertyAssignment(identifier, numericLiteral, durationUnit) {
    const duration = factory.createCallExpression(factory.createIdentifier(`Duration.${durationUnit}`), undefined, [
      factory.createNumericLiteral(numericLiteral),
    ]);
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), duration);
  }
  createStringPropertyAssignment(identifier, stringLiteral) {
    return factory.createPropertyAssignment(factory.createIdentifier(identifier), factory.createStringLiteral(stringLiteral));
  }
  createUserPoolClientAssignment(userPoolClient, imports) {
    const userPoolClientAttributesMap = new Map();
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
        typescript_1.default.NodeFlags.Const,
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
  createPropertyAccessChain(identifiers) {
    return identifiers
      .slice(1)
      .reduce(
        (acc, curr) => factory.createPropertyAccessExpression(acc, factory.createIdentifier(curr)),
        factory.createIdentifier(identifiers[0]),
      );
  }
  getProviderSetupDeclaration() {
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
                        factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken),
                        factory.createBinaryExpression(
                          this.createPropertyAccessChain(['child', 'node', 'id']),
                          factory.createToken(typescript_1.default.SyntaxKind.EqualsEqualsEqualsToken),
                          factory.createStringLiteral('amplifyAuth'),
                        ),
                      ),
                    ],
                  ),
                  factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword),
                ),
              ),
              factory.createIdentifier(providerSetupResult),
            ),
          ),
        ],
        typescript_1.default.NodeFlags.Const,
      ),
    );
  }
  getProviderSetupForeachStatement() {
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
            factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken),
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
                    typescript_1.default.NodeFlags.Const,
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
  createProviderSetupCode() {
    // Create const providerSetupResult = (backend.auth.stack.node.children.find(child => child.node.id === "amplifyAuth") as any).providerSetupResult;
    const providerSetupDeclaration = this.getProviderSetupDeclaration();
    // Create Object.keys(providerSetupResult).forEach(...)
    const forEachStatement = this.getProviderSetupForeachStatement();
    return [providerSetupDeclaration, forEachStatement];
  }
  createNestedObjectExpression(object, gen2PropertyMap) {
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
      (0, assert_1.default)(mappedClientSecretKey);
      objectLiterals.push(this.createBooleanPropertyAssignment(mappedClientSecretKey, false));
    }
    return factory.createObjectLiteralExpression(objectLiterals, true);
  }
  createReadWriteAttributes(identifier, attributes) {
    const standardAttrMap = new Map();
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
    const standardAttributesLiterals = [];
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
  mapOAuthScopes(scopes) {
    const scopeMap = new Map();
    scopeMap.set('phone', 'PHONE');
    scopeMap.set('email', 'EMAIL');
    scopeMap.set('openid', 'OPENID');
    scopeMap.set('profile', 'PROFILE');
    const scopesList = [];
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
  createOAuthObjectExpression(object, map) {
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
  createOAuthFlowsObjectExpression(value) {
    return factory.createObjectLiteralExpression([
      this.createBooleanPropertyAssignment('authorizationCodeGrant', value.includes(client_cognito_identity_provider_1.OAuthFlowType.code)),
      this.createBooleanPropertyAssignment('implicitCodeGrant', value.includes(client_cognito_identity_provider_1.OAuthFlowType.implicit)),
      this.createBooleanPropertyAssignment(
        'clientCredentials',
        value.includes(client_cognito_identity_provider_1.OAuthFlowType.client_credentials),
      ),
    ]);
  }
  createAuthFlowsObjectExpression(value) {
    return factory.createObjectLiteralExpression([
      this.createBooleanPropertyAssignment(
        'adminUserPassword',
        value.includes(client_cognito_identity_provider_1.ExplicitAuthFlowsType.ALLOW_ADMIN_USER_PASSWORD_AUTH),
      ),
      this.createBooleanPropertyAssignment(
        'custom',
        value.includes(client_cognito_identity_provider_1.ExplicitAuthFlowsType.ALLOW_CUSTOM_AUTH),
      ),
      this.createBooleanPropertyAssignment(
        'userPassword',
        value.includes(client_cognito_identity_provider_1.ExplicitAuthFlowsType.ALLOW_USER_PASSWORD_AUTH),
      ),
      this.createBooleanPropertyAssignment(
        'userSrp',
        value.includes(client_cognito_identity_provider_1.ExplicitAuthFlowsType.ALLOW_USER_SRP_AUTH),
      ),
    ]);
  }
  // id1.id2 = `templateHead-${templateSpan}templateTail`;
  createTemplateLiteralExpression(id1, id2, templateHead, templateSpan, templateTail) {
    return factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(factory.createIdentifier(id1), factory.createIdentifier(id2)),
        factory.createTemplateExpression(factory.createTemplateHead(templateHead), [
          factory.createTemplateSpan(factory.createIdentifier(templateSpan), factory.createTemplateTail(templateTail)),
        ]),
      ),
    );
  }
  createAmplifyEnvNameLogic() {
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
        typescript_1.default.NodeFlags.Let,
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
                factory.createToken(typescript_1.default.SyntaxKind.EqualsToken),
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
  render(renderArgs) {
    const authFunctionIdentifier = factory.createIdentifier('auth');
    const storageFunctionIdentifier = factory.createIdentifier('storage');
    const dataFunctionIdentifier = factory.createIdentifier('data');
    const backendFunctionIdentifier = factory.createIdentifier('defineBackend');
    const imports = [];
    const errors = [];
    const defineBackendProperties = [];
    const nodes = [];
    const mappedPolicyType = {
      MinimumLength: 'minimumLength',
      RequireUppercase: 'requireUppercase',
      RequireLowercase: 'requireLowercase',
      RequireNumbers: 'requireNumbers',
      RequireSymbols: 'requireSymbols',
      PasswordHistorySize: 'passwordHistorySize',
      TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
    };
    if (renderArgs.auth || renderArgs.storage?.hasS3Bucket || renderArgs.customResources) {
      imports.push(
        this.createImportStatement([factory.createIdentifier('RemovalPolicy'), factory.createIdentifier('Tags')], 'aws-cdk-lib'),
      );
    }
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
      const storage = factory.createShorthandPropertyAssignment(storageFunctionIdentifier);
      defineBackendProperties.push(storage);
    }
    if (renderArgs.function) {
      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      for (const [functionName, category] of functionNameCategories) {
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
    const ciInfoImportStatement = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, factory.createIdentifier('ci'), undefined),
      factory.createStringLiteral('ci-info'),
    );
    imports.push(ciInfoImportStatement);
    const envNameStatements = this.createAmplifyEnvNameLogic();
    errors.push(...envNameStatements);
    const callBackendFn = this.defineBackendCall(backendFunctionIdentifier, defineBackendProperties);
    const backendVariable = factory.createVariableDeclaration('backend', undefined, undefined, callBackendFn);
    const backendStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([backendVariable], typescript_1.default.NodeFlags.Const),
    );
    if (renderArgs.auth?.userPoolOverrides && !renderArgs?.auth?.referenceAuth) {
      const cfnUserPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnUserPool', 'auth.resources.cfnResources.cfnUserPool'),
      );
      nodes.push(cfnUserPoolVariableStatement);
      const policies = {
        passwordPolicy: {},
      };
      for (const [overridePath, value] of Object.entries(renderArgs.auth.userPoolOverrides)) {
        if (overridePath.includes('userPoolName')) {
          (0, assert_1.default)(value);
          (0, assert_1.default)(typeof value === 'string');
          const splitUserPoolName = value.split('-');
          const userPoolWithoutBackendEnvName = splitUserPoolName.slice(0, -1).join('-');
          const userPoolAssignment = this.createTemplateLiteralExpression(
            'cfnUserPool',
            'userPoolName',
            `${userPoolWithoutBackendEnvName}-`,
            amplifyGen1EnvName,
            '',
          );
          nodes.push(userPoolAssignment);
        } else if (overridePath.includes('PasswordPolicy')) {
          const policyKey = overridePath.split('.')[2];
          if (value !== undefined && policyKey in mappedPolicyType) {
            policies.passwordPolicy[mappedPolicyType[policyKey]] = value;
          }
        } else {
          nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPool'), overridePath, value));
        }
      }
      nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPool'), 'policies', policies));
    }
    if (renderArgs.auth?.guestLogin === false || (renderArgs.auth?.identityPoolName && !renderArgs?.auth?.referenceAuth)) {
      const cfnIdentityPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnIdentityPool', 'auth.resources.cfnResources.cfnIdentityPool'),
      );
      nodes.push(cfnIdentityPoolVariableStatement);
      if (renderArgs.auth?.identityPoolName) {
        const splitIdentityPoolName = renderArgs.auth.identityPoolName.split('_');
        const identityPoolWithoutBackendEnvName = splitIdentityPoolName.slice(0, -1).join('_');
        const identityPoolAssignment = this.createTemplateLiteralExpression(
          'cfnIdentityPool',
          'identityPoolName',
          `${identityPoolWithoutBackendEnvName}_`,
          amplifyGen1EnvName,
          '',
        );
        nodes.push(identityPoolAssignment);
      }
      if (renderArgs.auth?.guestLogin === false) {
        nodes.push(this.setPropertyValue(factory.createIdentifier('cfnIdentityPool'), 'allowUnauthenticatedIdentities', false));
      }
    }
    if (
      (renderArgs.auth?.oAuthFlows || renderArgs.auth?.readAttributes || renderArgs.auth?.writeAttributes) &&
      !renderArgs?.auth?.referenceAuth
    ) {
      const cfnUserPoolClientVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnUserPoolClient', 'auth.resources.cfnResources.cfnUserPoolClient'),
      );
      nodes.push(cfnUserPoolClientVariableStatement);
      if (renderArgs.auth?.oAuthFlows) {
        nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPoolClient'), 'allowedOAuthFlows', renderArgs.auth?.oAuthFlows));
      }
      if (renderArgs.auth?.readAttributes) {
        nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPoolClient'), 'readAttributes', renderArgs.auth?.readAttributes));
      }
    }
    if (renderArgs.auth?.writeAttributes && !renderArgs?.auth?.referenceAuth) {
      nodes.push(this.setPropertyValue(factory.createIdentifier('cfnUserPoolClient'), 'writeAttributes', renderArgs.auth?.writeAttributes));
    }
    // Since Gen2 only supports 1 user pool client by default, we need to add CDK overrides for the additional user pool client from Gen1
    if (renderArgs.auth?.userPoolClient) {
      const userPoolVariableStatement = this.createVariableStatement(this.createVariableDeclaration('userPool', 'auth.resources.userPool'));
      nodes.push(userPoolVariableStatement);
      nodes.push(this.createUserPoolClientAssignment(renderArgs.auth?.userPoolClient, imports));
    }
    if (renderArgs.storage && renderArgs.storage.hasS3Bucket) {
      (0, assert_1.default)(renderArgs.storage.bucketName);
      const cfnStorageVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('s3Bucket', 'storage.resources.cfnResources.cfnBucket'),
      );
      nodes.push(cfnStorageVariableStatement);
      const splitBucketName = renderArgs.storage.bucketName.split('-');
      const bucketNameWithoutBackendEnvName = splitBucketName.slice(0, -1).join('-');
      const bucketNameAssignment = this.createTemplateLiteralExpression(
        '// s3Bucket',
        'bucketName',
        `${bucketNameWithoutBackendEnvName}-`,
        amplifyGen1EnvName,
        '',
      );
      nodes.push(bucketNameAssignment);
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
        const serverSideEncryptionByDefaultMap = new Map();
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
    return factory.createNodeArray(
      [...imports, ts_factory_utils_1.newLineIdentifier, ...errors, ts_factory_utils_1.newLineIdentifier, backendStatement, ...nodes],
      true,
    );
  }
}
exports.BackendSynthesizer = BackendSynthesizer;
//# sourceMappingURL=synthesizer.js.map
