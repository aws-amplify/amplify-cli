import { APIIAMResourceProvider, GraphQLAPIProvider, MappingTemplateProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ElasticSearchDataSourceOptions } from '@aws-amplify/graphql-transformer-interfaces/src/graphql-api-provider';
import {
  ApiKeyConfig,
  AuthorizationConfig,
  AuthorizationMode,
  AuthorizationType,
  BaseDataSource,
  CfnApiKey,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
  DataSourceOptions,
  DynamoDbDataSource,
  GraphqlApiBase,
  HttpDataSource,
  HttpDataSourceOptions,
  LambdaDataSource,
  LogConfig,
  NoneDataSource,
  OpenIdConnectConfig,
  UserPoolConfig,
  UserPoolDefaultAction,
} from '@aws-cdk/aws-appsync';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { Grant, IGrantable, IRole, ManagedPolicy, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnFunction, Code, Function, IFunction, ILayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import { CfnResource, Construct, Duration, Stack, Token } from '@aws-cdk/core';
import { toCamelCase } from 'graphql-transformer-common';
import { AppSyncFunctionConfiguration } from './appsync-function';
import { ElasticsearchDataSource } from './cdk-compat/elasticsearch-datasource';
import { TransformerSchema } from './cdk-compat/schema-asset';
import { InlineTemplate, S3MappingFunctionCode } from './cdk-compat/template-asset';

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
};
export class GraphQLApi extends GraphqlApiBase implements GraphQLAPIProvider {
  /**
   * an unique AWS AppSync GraphQL API identifier
   * i.e. 'lxz775lwdrgcndgz3nurvac7oa'
   */
  public readonly apiId: string;

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

  private schemaResource: CfnGraphQLSchema;
  private api: CfnGraphQLApi;
  private apiKeyResource?: CfnApiKey;
  private authorizationConfig?: Required<AuthorizationConfig>;

  private dataSources: Map<string, BaseDataSource> = new Map();

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

    this.validateAuthorizationProps(modes);

    this.api = new CfnGraphQLApi(this, 'Resource', {
      name: props.name,
      authenticationType: defaultMode.authorizationType,
      logConfig: this.setupLogConfig(props.logConfig),
      openIdConnectConfig: this.setupOpenIdConnectConfig(defaultMode.openIdConnectConfig),
      userPoolConfig: this.setupUserPoolConfig(defaultMode.userPoolConfig),
      additionalAuthenticationProviders: this.setupAdditionalAuthorizationModes(additionalModes),
      xrayEnabled: props.xrayEnabled,
    });

    this.apiId = this.api.attrApiId;
    this.arn = this.api.attrArn;
    this.graphqlUrl = this.api.attrGraphQlUrl;
    this.name = this.api.name;
    this.schema = props.schema ?? new TransformerSchema();
    this.schemaResource = this.schema.bind(this);

    if (props.createApiKey && modes.some(mode => mode.authorizationType === AuthorizationType.API_KEY)) {
      const config = modes.find((mode: AuthorizationMode) => {
        return mode.authorizationType === AuthorizationType.API_KEY && mode.apiKeyConfig;
      })?.apiKeyConfig;
      this.apiKeyResource = this.createAPIKey(config);
      this.apiKeyResource.addDependsOn(this.schemaResource);
      this.apiKey = this.apiKeyResource.attrApiKey;
    }
  }

  addElasticSearchDataSource(
    name: string,
    awsRegion: string,
    endpoint: string,
    options?: ElasticSearchDataSourceOptions,
    stack?: Stack,
  ): ElasticsearchDataSource {
    if (this.dataSources.has(name)) {
      throw new Error(`DataSource ${name} already exists in the API`);
    }
    const data = this.doAddElasticSearchDataSource(name, endpoint, awsRegion, options, stack);
    this.dataSources.set(options?.name || name, data);
    return data;
  }

  public addHttpDataSource(name: string, endpoint: string, options?: DataSourceOptions, stack?: Stack): HttpDataSource {
    if (this.dataSources.has(name)) {
      throw new Error(`DataSource ${name} already exists in the API`);
    }
    const dataSource = this.doAddHttpDataSource(name, endpoint, options, stack);
    this.dataSources.set(name, dataSource);
    return dataSource;
  }

  public addDynamoDbDataSource(name: string, table: ITable, options?: DataSourceOptions, stack?: Stack): DynamoDbDataSource {
    if (this.dataSources.has(name)) {
      throw new Error(`DataSource ${name} already exists in the API`);
    }
    const dataSource = this.doAddDynamoDbDataSource(name, table, options, stack);
    this.dataSources.set(options?.name || name, dataSource);
    return dataSource;
  }

  public addNoneDataSource(name: string, options?: DataSourceOptions, stack?: Stack): NoneDataSource {
    if (this.dataSources.has(name)) {
      throw new Error(`DataSource ${name} already exists in the API`);
    }
    const dataSource = this.doAddNoneDataSource(name, options, stack);
    this.dataSources.set(name, dataSource);
    return dataSource;
  }

  public addLambdaDataSource(name: string, lambdaFunction: IFunction, options?: DataSourceOptions, stack?: Stack): LambdaDataSource {
    if (!Token.isUnresolved(name) && this.dataSources.has(name)) {
      throw new Error(`DataSource ${name} already exists in the API`);
    }
    const dataSource = this.doAddLambdaDataSource(name, lambdaFunction, options, stack);
    this.dataSources.set(name, dataSource);
    return dataSource;
  }

  public addAppSyncFunction(
    name: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
    dataSourceName: string,
    stack?: Stack,
  ): AppSyncFunctionConfiguration {
    if (dataSourceName && !Token.isUnresolved(dataSourceName) && !this.dataSources.has(dataSourceName)) {
      throw new Error(`DataSource ${dataSourceName} is missing in the API`);
    }
    const dataSource = this.dataSources.get(dataSourceName);
    const fn = new AppSyncFunctionConfiguration(stack || this, name, {
      api: this,
      dataSource: dataSource || dataSourceName,
      requestMappingTemplate,
      responseMappingTemplate,
    });
    return fn;
  }

  addLambdaFunction(
    functionName: string,
    functionKey: string,
    handlerName: string,
    filePath: string,
    runtime: Runtime,
    layers?: ILayerVersion[],
    role?: IRole,
    environment?: { [key: string]: string },
    stack?: Stack,
  ): IFunction {
    const dummycode = `if __name__ == "__main__":`; // assing dummy code so as to be overriden later
    const fn = new Function(stack || this, functionName, {
      code: Code.fromInline(dummycode),
      handler: handlerName,
      runtime,
      role,
      layers,
      environment,
    });
    fn.addLayers();
    const functionCode = new S3MappingFunctionCode(functionKey, filePath).bind(fn);
    (fn.node.defaultChild as CfnFunction).code = {
      s3Key: functionCode.s3ObjectKey,
      s3Bucket: functionCode.s3BucketName,
    };
    return fn;
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

  public addResolver(
    typeName: string,
    fieldName: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
    dataSourceName?: string,
    pipelineConfig?: string[],
    stack?: Stack,
  ) {
    if (dataSourceName && !Token.isUnresolved(dataSourceName) && !this.dataSources.has(dataSourceName)) {
      throw new Error(`DataSource ${dataSourceName} is missing in the API`);
    }

    const requestTemplateLocation = requestMappingTemplate.bind(this);
    const responseTemplateLocation = responseMappingTemplate.bind(this);
    const resolverName = toCamelCase([typeName, fieldName, 'Resolver']);
    if (dataSourceName) {
      const dataSource = this.dataSources.get(dataSourceName);

      const resolver = new CfnResolver(stack || this, resolverName, {
        apiId: this.apiId,
        fieldName: fieldName,
        typeName: typeName,
        kind: 'UNIT',
        dataSourceName: dataSource?.ds.attrName || dataSourceName,
        ...(requestMappingTemplate instanceof InlineTemplate
          ? { requestMappingTemplate: requestTemplateLocation }
          : { requestMappingTemplateS3Location: requestTemplateLocation }),
        ...(responseMappingTemplate instanceof InlineTemplate
          ? { responseMappingTemplate: responseTemplateLocation }
          : { responseMappingTemplateS3Location: responseTemplateLocation }),
      });
      this.addSchemaDependency(resolver);
      return resolver;
    } else if (pipelineConfig) {
      const resolver = new CfnResolver(stack || this, resolverName, {
        apiId: this.apiId,
        fieldName: fieldName,
        typeName: typeName,
        kind: 'PIPELINE',
        ...(requestMappingTemplate instanceof InlineTemplate
          ? { requestMappingTemplate: requestTemplateLocation }
          : { requestMappingTemplateS3Location: requestTemplateLocation }),
        ...(responseMappingTemplate instanceof InlineTemplate
          ? { responseMappingTemplate: responseTemplateLocation }
          : { responseMappingTemplateS3Location: responseTemplateLocation }),
        pipelineConfig: {
          functions: pipelineConfig,
        },
      });
      this.addSchemaDependency(resolver);
      return resolver;
    } else {
      throw new Error('Resolver needs either dataSourceName or pipelineConfig to be passed');
    }
  }

  public hasDataSource(name: string): boolean {
    return this.dataSources.has(name);
  }
  public getDataSource = (name: string): BaseDataSource | void => {
    if (this.hasDataSource(name)) {
      return this.dataSources.get(name);
    }
  };

  /**
   *
   * @param id The data source's id
   * @param options optional configuration for data source
   * @param stack  Stack to which this datasource needs to mapped to
   */
  protected doAddNoneDataSource(id: string, options?: DataSourceOptions, stack?: Stack): NoneDataSource {
    return new NoneDataSource(stack ?? this, id, {
      api: this,
      name: options?.name,
      description: options?.description,
    });
  }

  /**
   * add a new DynamoDB data source to this API
   *
   * @param id The data source's id
   * @param table The DynamoDB table backing this data source
   * @param options The optional configuration for this data source
   * @param stack  Stack to which this datasource needs to mapped to
   */
  protected doAddDynamoDbDataSource(id: string, table: ITable, options?: DataSourceOptions, stack?: Stack): DynamoDbDataSource {
    return new DynamoDbDataSource(stack ?? this, id, {
      api: this,
      table,
      name: options?.name,
      description: options?.description,
    });
  }

  /**
   * add a new http data source to this API
   *
   * @param id The data source's id
   * @param endpoint The http endpoint
   * @param options The optional configuration for this data source
   * @param stack Stack to which the http datasource needs to be created in
   */
  protected doAddHttpDataSource(id: string, endpoint: string, options?: HttpDataSourceOptions, stack?: Stack): HttpDataSource {
    return new HttpDataSource(stack ?? this, id, {
      api: this,
      endpoint,
      name: options?.name,
      description: options?.description,
      authorizationConfig: options?.authorizationConfig,
    });
  }

  /**
   * add a new elasticsearch data source to this API
   *
   * @param id The data source's id
   * @param endpoint The elasticsearch endpoint
   * @param region The elasticsearch datasource region
   * @param options The optional configuration for this data source
   * @param stack Stack to which the elasticsearch datasource needs to be created in
   */
  protected doAddElasticSearchDataSource(
    id: string,
    endpoint: string,
    region: string,
    options?: ElasticSearchDataSourceOptions,
    stack?: Stack,
  ): ElasticsearchDataSource {
    return new ElasticsearchDataSource(stack ?? this, id, {
      api: this,
      name: options?.name,
      endpoint,
      region,
      serviceRole: options?.serviceRole,
    });
  }

  /**
   * add a new Lambda data source to this API
   *
   * @param id The data source's id
   * @param lambdaFunction The Lambda function to call to interact with this data source
   * @param options The optional configuration for this data source
   */
  protected doAddLambdaDataSource(id: string, lambdaFunction: IFunction, options?: DataSourceOptions, stack?: Stack): LambdaDataSource {
    return new LambdaDataSource(stack || this, id, {
      api: this,
      lambdaFunction,
      name: options?.name,
      description: options?.description,
    });
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

  private setupAdditionalAuthorizationModes(modes?: AuthorizationMode[]) {
    if (!modes || modes.length === 0) return undefined;
    return modes.reduce<CfnGraphQLApi.AdditionalAuthenticationProviderProperty[]>(
      (acc, mode) => [
        ...acc,
        {
          authenticationType: mode.authorizationType,
          userPoolConfig: this.setupUserPoolConfig(mode.userPoolConfig),
          openIdConnectConfig: this.setupOpenIdConnectConfig(mode.openIdConnectConfig),
        },
      ],
      [],
    );
  }
}
