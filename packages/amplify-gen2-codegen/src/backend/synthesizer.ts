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
import { PolicyOverrides, ReferenceAuth } from '../auth/source_builder.js';
import { BucketAccelerateStatus, BucketVersioningStatus } from '@aws-sdk/client-s3';
import { AccessPatterns, ServerSideEncryptionConfiguration } from '../storage/source_builder.js';
import { UserPoolClientType, OAuthFlowType, ExplicitAuthFlowsType } from '@aws-sdk/client-cognito-identity-provider';
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
  unsupportedCategories?: Map<string, string>;
}

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

  private createBooleanPropertyAssignment(identifier: string, condition: any) {
    return factory.createPropertyAssignment(
      factory.createIdentifier(identifier),
      condition ?? null ? factory.createTrue() : factory.createFalse(),
    );
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

  private addRemovalPolicyAssigment(identifier: string) {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(identifier), factory.createIdentifier('applyRemovalPolicy')),
      undefined,
      [
        factory.createIdentifier('RemovalPolicy.RETAIN'),
        factory.createObjectLiteralExpression(
          [factory.createPropertyAssignment(factory.createIdentifier('applyToUpdateReplacePolicy'), factory.createTrue())],
          false,
        ),
      ],
    );
  }

  private createUserPoolClientAssignment(userPoolClient: UserPoolClientType, imports: any[]) {
    const userPoolAtrributesMap = new Map<string, string>();
    userPoolAtrributesMap.set('ClientName', 'userPoolClientName');
    userPoolAtrributesMap.set('ClientSecret', 'generateSecret');
    userPoolAtrributesMap.set('ReadAttributes', 'readAttributes');
    userPoolAtrributesMap.set('WriteAttributes', 'writeAttributes');
    userPoolAtrributesMap.set('RefreshTokenValidity', 'refreshTokenValidity');
    userPoolAtrributesMap.set('AccessTokenValidity', 'accessTokenValidity');
    userPoolAtrributesMap.set('IdTokenValidity', 'idTokenValidity');
    userPoolAtrributesMap.set('RefreshToken', 'refreshToken');
    userPoolAtrributesMap.set('AccessToken', 'accessToken');
    userPoolAtrributesMap.set('IdToken', 'idToken');
    userPoolAtrributesMap.set('AllowedOAuthScopes', 'scopes');
    userPoolAtrributesMap.set('CallbackURLs', 'callbackUrls');
    userPoolAtrributesMap.set('LogoutURLs', 'logoutUrls');
    userPoolAtrributesMap.set('DefaultRedirectURI', 'defaultRedirectUri');
    userPoolAtrributesMap.set('AllowedOAuthFlowsUserPoolClient', 'disableOAuth');
    userPoolAtrributesMap.set('EnableTokenRevocation', 'enableTokenRevocation');
    userPoolAtrributesMap.set('EnablePropagateAdditionalUserContextData', 'enablePropagateAdditionalUserContextData');
    userPoolAtrributesMap.set('SupportedIdentityProviders', 'supportedIdentityProviders');
    userPoolAtrributesMap.set('AuthSessionValidity', 'authSessionValidity');
    userPoolAtrributesMap.set('ExplicitAuthFlows', 'authFlows');
    userPoolAtrributesMap.set('AllowedOAuthFlows', 'flows');

    const test = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('addClient')),
      undefined,
      [factory.createStringLiteral(userPoolClient.UserPoolId!), this.createNestedObjectExpression(userPoolClient, userPoolAtrributesMap)],
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

    return test;
  }

  private createNestedObjectExpression(object: Record<string, any>, gen2PropertyMap: Map<string, string>): ts.ObjectLiteralExpression {
    const objectLiterals = [];

    for (const [key, value] of Object.entries(object)) {
      if (typeof value == 'boolean' && gen2PropertyMap.has(key)) {
        objectLiterals.push(this.createBooleanPropertyAssignment(gen2PropertyMap.get(key)!, value));
      } else if (typeof value == 'string' && gen2PropertyMap.has(key)) {
        if (!this.oAuthFlag && key == 'DefaultRedirectURI') {
          this.oAuthFlag = true;
          objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
        } else if (key == 'ClientSecret') {
          objectLiterals.push(this.createBooleanPropertyAssignment(gen2PropertyMap.get(key)!, value));
        } else if (key != 'DefaultRedirectURI') {
          objectLiterals.push(this.createStringPropertyAssignment(gen2PropertyMap.get(key)!, value));
        }
      } else if (typeof value == 'number' && gen2PropertyMap.has(key)) {
        if (['IdTokenValidity', 'RefreshTokenValidity', 'AccessTokenValidity', 'AuthSessionValidity'].includes(key)) {
          // convert it to Duration
          this.importDurationFlag = true;
          if (key == 'IdTokenValidity') {
            let durationUnit = 'hours';
            if (object['TokenValidityUnits'] && object['TokenValidityUnits'].IdToken) {
              durationUnit = object['TokenValidityUnits'].IdToken;
            }
            objectLiterals.push(this.createDurationPropertyAssignment(gen2PropertyMap.get(key)!, value, durationUnit));
          } else if (key == 'RefreshTokenValidity') {
            let durationUnit = 'days';
            if (object['TokenValidityUnits'] && object['TokenValidityUnits'].RefreshToken) {
              durationUnit = object['TokenValidityUnits'].RefreshToken;
            }
            objectLiterals.push(this.createDurationPropertyAssignment(gen2PropertyMap.get(key)!, value, durationUnit));
          } else if (key == 'AccessTokenValidity') {
            let durationUnit = 'hours';
            if (object['TokenValidityUnits'] && object['TokenValidityUnits'].AccessToken) {
              durationUnit = object['TokenValidityUnits'].AccessToken;
            }
            objectLiterals.push(this.createDurationPropertyAssignment(gen2PropertyMap.get(key)!, value, durationUnit));
          } else if (key == 'AuthSessionValidity') {
            objectLiterals.push(this.createDurationPropertyAssignment(gen2PropertyMap.get(key)!, value, 'minutes'));
          }
        } else {
          objectLiterals.push(this.createNumericPropertyAssignment(gen2PropertyMap.get(key)!, value));
        }
      } else if (Array.isArray(value) && gen2PropertyMap.has(key)) {
        if (key == 'ReadAttributes' || key == 'WriteAttributes') {
          objectLiterals.push(this.createReadWriteAttributes(gen2PropertyMap.get(key)!, value));
        } else if (key == 'SupportedIdentityProviders') {
          this.supportedIdentityProviderFlag = true;
          objectLiterals.push(this.createEnumListPropertyAssignment(gen2PropertyMap.get(key)!, 'UserPoolClientIdentityProvider', value));
        } else if (!this.oAuthFlag && key == 'AllowedOAuthFlows') {
          this.oAuthFlag = true;
          objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
        } else if (key == 'ExplicitAuthFlows') {
          objectLiterals.push(
            factory.createPropertyAssignment(
              factory.createIdentifier(gen2PropertyMap.get(key)!),
              this.createAuthFlowsObjectExpression(value),
            ),
          );
        } else if (!this.oAuthFlag && key == 'AllowedOAuthScopes') {
          this.oAuthFlag = true;
          objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
        } else {
          if (!this.oAuthFlag && (key == 'CallbackURLs' || key == 'LogoutURLs')) {
            this.oAuthFlag = true;
            objectLiterals.push(this.createOAuthObjectExpression(object, gen2PropertyMap));
          } else if (key != 'CallbackURLs' && key != 'LogoutURLs' && key != 'AllowedOAuthScopes') {
            objectLiterals.push(this.createListPropertyAssignment(gen2PropertyMap.get(key)!, value));
          }
        }
      } else if (gen2PropertyMap.has(key) && typeof value == 'object') {
        objectLiterals.push(
          factory.createPropertyAssignment(factory.createIdentifier(key), this.createNestedObjectExpression(value, gen2PropertyMap)),
        );
      }
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
        standardAttributesLiterals.push(
          factory.createPropertyAssignment(factory.createIdentifier(standardAttrMap.get(attribute)!), factory.createTrue()),
        );
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

    const scopesList: string[] = [];
    scopes.forEach((scope) => {
      if (scopeMap.has(scope)) {
        scopesList.push(scopeMap.get(scope)!);
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
        oAuthLiterals.push(this.createListPropertyAssignment(map.get(key)!, value));
      } else if (key == 'DefaultRedirectURI') {
        oAuthLiterals.push(this.createStringPropertyAssignment(map.get(key)!, value));
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

    if (renderArgs.auth?.userPoolOverrides && !renderArgs?.auth?.referenceAuth) {
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
      nodes.push(this.addRemovalPolicyAssigment('cfnUserPool'));
    }

    if (renderArgs.auth?.guestLogin === false || (renderArgs.auth?.identityPoolName && !renderArgs?.auth?.referenceAuth)) {
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
      nodes.push(this.addRemovalPolicyAssigment('cfnIdentityPool'));
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
    if (renderArgs.auth?.userPoolClient) {
      const userPoolVariableStatement = this.createVariableStatement(this.createVariableDeclaration('userPool', 'auth.resources.userPool'));
      nodes.push(userPoolVariableStatement);
      nodes.push(this.createUserPoolClientAssignment(renderArgs.auth?.userPoolClient, imports));
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
      nodes.push(this.addRemovalPolicyAssigment('s3Bucket'));
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
        const serverSideEncryptionByDefaultMap = new Map<any, any>();
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

    return factory.createNodeArray([...imports, ...errors, backendStatement, ...nodes], true);
  }
}
