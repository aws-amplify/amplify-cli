import { APIIAMResourceProvider, GraphQLAPIProvider, TransformHostProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  ApiKeyConfig,
  AuthorizationConfig,
  AuthorizationMode,
  AuthorizationType,
  CfnApiKey,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  GraphqlApiBase,
  LogConfig,
  OpenIdConnectConfig,
  UserPoolConfig,
  UserPoolDefaultAction,
} from '@aws-cdk/aws-appsync';
import { Grant, IGrantable, ManagedPolicy, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnResource, Construct, Duration, Stack } from '@aws-cdk/core';
import { TransformerSchema } from './cdk-compat/schema-asset';
import { DefaultTransformHost } from './transform-host';
import * as cdk from '@aws-cdk/core';

export interface GraphqlApiProps {
  /**
   *  the name of the GraphQL API.
   *
   */
  readonly name: string;
  /**
   *  Optional authorization configuration.
   *
   * @default - API Key authorization
   */
  readonly authorizationConfig?: AuthorizationConfig;
  /**
   *  Logging configuration for this api.
   *
   * @default - None
   */
  readonly logConfig?: LogConfig;
  /**
   *  GraphQL schema definition. Specify how you want to define your schema.
   *
   * Schema.fromFile(filePath: string) allows schema definition through schema.graphql file
   *
   * @default - schema will be generated code-first (i.e. addType, addObjectType, etc.)
   */
  readonly schema?: TransformerSchema;
  /**
   *  A flag indicating whether or not X-Ray tracing is enabled for the GraphQL API.
   *
   * @default - false
   */
  readonly xrayEnabled?: boolean;
}

export class IamResource implements APIIAMResourceProvider {
  /**
   * Generate the resource names given custom arns
   *
   * @param arns The custom arns that need to be permissioned
   *
   * Example: custom('/types/Query/fields/getExample')
   */
  public static custom(...arns: string[]): IamResource {
    if (arns.length === 0) {
      throw new Error('At least 1 custom ARN must be provided.');
    }
    return new IamResource(arns);
  }

  /**
   * Generate the resource names given a type and fields
   *
   * @param type The type that needs to be allowed
   * @param fields The fields that need to be allowed, if empty grant permissions to ALL fields
   *
   * Example: ofType('Query', 'GetExample')
   */
  public static ofType(type: string, ...fields: string[]): IamResource {
    const arns = fields.length ? fields.map(field => `types/${type}/fields/${field}`) : [`types/${type}/*`];
    return new IamResource(arns);
  }

  /**
   * Generate the resource names that accepts all types: `*`
   */
  public static all(): IamResource {
    return new IamResource(['*']);
  }

  private arns: string[];

  private constructor(arns: string[]) {
    this.arns = arns;
  }

  /**
   * Return the Resource ARN
   *
   * @param api The GraphQL API to give permissions
   */
  public resourceArns(api: GraphQLAPIProvider): string[] {
    return this.arns.map(arn =>
      Stack.of(api).formatArn({
        service: 'appsync',
        resource: `apis/${api.apiId}`,
        sep: '/',
        resourceName: `${arn}`,
      }),
    );
  }
}

export type TransformerAPIProps = GraphqlApiProps & {
  readonly createApiKey?: boolean;
  readonly host?: TransformHostProvider;
  readonly sandboxModeEnabled?: boolean;
  readonly environmentName?: string;
};
export class GraphQLApi extends GraphqlApiBase implements GraphQLAPIProvider {
  /**
   * an unique AWS AppSync GraphQL API identifier
   * i.e. 'lxz775lwdrgcndgz3nurvac7oa'
   */
  public readonly apiId: string;

  /**
   * The TransformHost object provides resource creation utilities in AWS
   * such as a LambdaDataSource or a DynamoDBDataSource
   */
  public readonly host: TransformHostProvider;

  /**
   * the ARN of the API
   */
  public readonly arn: string;

  /**
   * the URL of the endpoint created by AppSync
   *
   * @attribute GraphQlUrl
   */
  public readonly graphqlUrl: string;

  /**
   * the name of the API
   */
  public readonly name: string;

  /**
   * the schema attached to this api
   */
  public readonly schema: TransformerSchema;

  /**
   * The Authorization Types for this GraphQL Api
   */
  public readonly modes: AuthorizationType[];

  /**
   * the configured API key, if present
   *
   * @default - no api key
   */
  public readonly apiKey?: string;

  /**
   * Global Sandbox Mode for GraphQL API
   */
  public readonly sandboxModeEnabled?: boolean;
  
  /**
   * the amplify environment name
   */
  public readonly environmentName?: string;

  private schemaResource: CfnGraphQLSchema;
  private api: CfnGraphQLApi;
  private apiKeyResource?: CfnApiKey;
  private authorizationConfig?: Required<AuthorizationConfig | any>;

  constructor(scope: Construct, id: string, props: TransformerAPIProps) {
    super(scope, id);
    this.authorizationConfig = {
      defaultAuthorization: { authorizationType: AuthorizationType.API_KEY },
      additionalAuthorizationModes: [],
      ...props.authorizationConfig,
    };
    const defaultMode = this.authorizationConfig.defaultAuthorization;
    const additionalModes = this.authorizationConfig.additionalAuthorizationModes;
    const modes = [defaultMode, ...additionalModes];

    this.modes = modes.map(mode => mode.authorizationType);
    this.environmentName = props.environmentName;
    this.validateAuthorizationProps(modes);

    this.api = new CfnGraphQLApi(this, 'Resource', {
      name: props.name,
      authenticationType: defaultMode.authorizationType,
      logConfig: this.setupLogConfig(props.logConfig),
      openIdConnectConfig: this.setupOpenIdConnectConfig(defaultMode.openIdConnectConfig),
      userPoolConfig: this.setupUserPoolConfig(defaultMode.userPoolConfig),
      lambdaAuthorizerConfig: this.setupLambdaConfig(defaultMode.lambdaAuthorizerConfig),
      additionalAuthenticationProviders: this.setupAdditionalAuthorizationModes(additionalModes),
      xrayEnabled: props.xrayEnabled,
    });

    this.apiId = this.api.attrApiId;
    this.arn = this.api.attrArn;
    this.graphqlUrl = this.api.attrGraphQlUrl;
    this.name = this.api.name;
    this.schema = props.schema ?? new TransformerSchema();
    this.schemaResource = this.schema.bind(this);

    const hasApiKey = modes.some(mode => mode.authorizationType === AuthorizationType.API_KEY);

    if (props.createApiKey && hasApiKey) {
      const config = modes.find((mode: AuthorizationMode) => {
        return mode.authorizationType === AuthorizationType.API_KEY && mode.apiKeyConfig;
      })?.apiKeyConfig;
      this.apiKeyResource = this.createAPIKey(config);
      this.apiKeyResource.addDependsOn(this.schemaResource);
      this.apiKey = this.apiKeyResource.attrApiKey;
    }

    if (hasApiKey && props.sandboxModeEnabled) this.sandboxModeEnabled = true;

    if (props.host) {
      this.host = props.host;
      this.host.setAPI(this);
    } else {
      this.host = new DefaultTransformHost({
        api: this,
      });
    }
  }

  /**
   * Adds an IAM policy statement associated with this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param resources The set of resources to allow (i.e. ...:[region]:[accountId]:apis/GraphQLId/...)
   * @param actions The actions that should be granted to the principal (i.e. appsync:graphql )
   */
  public grant(grantee: IGrantable, resources: IamResource, ...actions: string[]): Grant {
    return Grant.addToPrincipal({
      grantee,
      actions,
      resourceArns: resources.resourceArns(this),
      scope: this,
    });
  }

  public grantQuery(grantee: IGrantable, ...fields: string[]): Grant {
    return this.grant(grantee, IamResource.ofType('Query', ...fields), 'appsync:GraphQL');
  }

  public grantMutation(grantee: IGrantable, ...fields: string[]): Grant {
    return this.grant(grantee, IamResource.ofType('Mutation', ...fields), 'appsync:GraphQL');
  }

  /**
   * Adds an IAM policy statement for Subscription access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Subscriptions (leave blank for all)
   */
  public grantSubscription(grantee: IGrantable, ...fields: string[]): Grant {
    return this.grant(grantee, IamResource.ofType('Subscription', ...fields), 'appsync:GraphQL');
  }

  public createAPIKey(config?: ApiKeyConfig) {
    if (config?.expires?.isBefore(Duration.days(1)) || config?.expires?.isAfter(Duration.days(365))) {
      throw Error('API key expiration must be between 1 and 365 days.');
    }
    const expires = config?.expires ? config?.expires.toEpoch() : undefined;
    return new CfnApiKey(this, `${config?.name || 'Default'}ApiKey`, {
      expires,
      description: config?.description || undefined,
      apiId: this.apiId,
    });
  }

  public addToSchema(content: string): void {
    this.schema.addToSchema(content, '\n');
  }

  public getDefaultAuthorization() {
    return this.authorizationConfig?.defaultAuthorization;
  }

  private validateAuthorizationProps(modes: AuthorizationMode[]) {
    modes.forEach(mode => {
      if (mode.authorizationType === AuthorizationType.OIDC && !mode.openIdConnectConfig) {
        throw new Error('Missing default OIDC Configuration');
      }
      if (mode.authorizationType === AuthorizationType.USER_POOL && !mode.userPoolConfig) {
        throw new Error('Missing default OIDC Configuration');
      }
    });
    if (modes.filter(mode => mode.authorizationType === AuthorizationType.API_KEY).length > 1) {
      throw new Error("You can't duplicate API_KEY configuration. See https://docs.aws.amazon.com/appsync/latest/devguide/security.html");
    }
    if (modes.filter(mode => mode.authorizationType === AuthorizationType.IAM).length > 1) {
      throw new Error("You can't duplicate IAM configuration. See https://docs.aws.amazon.com/appsync/latest/devguide/security.html");
    }
  }

  public addSchemaDependency(construct: CfnResource): boolean {
    construct.addDependsOn(this.schemaResource);
    return true;
  }

  private setupLogConfig(config?: LogConfig) {
    if (!config) return undefined;
    const role = new Role(this, 'ApiLogsRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')],
    });
    return {
      cloudWatchLogsRoleArn: role.roleArn,
      excludeVerboseContent: config.excludeVerboseContent,
      fieldLogLevel: config.fieldLogLevel,
    };
  }

  private setupOpenIdConnectConfig(config?: OpenIdConnectConfig) {
    if (!config) return undefined;
    return {
      authTtl: config.tokenExpiryFromAuth,
      clientId: config.clientId,
      iatTtl: config.tokenExpiryFromIssue,
      issuer: config.oidcProvider,
    };
  }

  private setupUserPoolConfig(config?: UserPoolConfig) {
    if (!config) return undefined;
    return {
      userPoolId: config.userPool.userPoolId,
      awsRegion: config.userPool.stack.region,
      appIdClientRegex: config.appIdClientRegex,
      defaultAction: config.defaultAction || UserPoolDefaultAction.ALLOW,
    };
  }

  private setupLambdaConfig(config?: any) {
    if (!config) return undefined;
    return {
      authorizerUri: this.lambdaArnKey(config.lambdaFunction),
      authorizerResultTtlInSeconds: config.ttlSeconds,
      identityValidationExpression: "",
    };
  }

  private lambdaArnKey(name: string) {
    return this.environmentName ?
      `arn:${cdk.Aws.PARTITION}:lambda:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:function:${name}-${this.environmentName}`
      : `arn:${cdk.Aws.PARTITION}:lambda:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:function:${name}`;
  }

  private setupAdditionalAuthorizationModes(modes?: Array<AuthorizationMode | any>) {
    if (!modes || modes.length === 0) return undefined;
    return modes.reduce<CfnGraphQLApi.AdditionalAuthenticationProviderProperty[]>(
      (acc, mode) => [
        ...acc,
        {
          authenticationType: mode.authorizationType,
          userPoolConfig: this.setupUserPoolConfig(mode.userPoolConfig),
          openIdConnectConfig: this.setupOpenIdConnectConfig(mode.openIdConnectConfig),
          lambdaAuthorizerConfig: this.setupLambdaConfig(mode.lambdaAuthorizerConfig),
        },
      ],
      [],
    );
  }
}
