import { DynamoDbDataSourceOptions, TransformHostProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { SearchableDataSourceOptions, MappingTemplateProvider } from '@aws-amplify/graphql-transformer-interfaces/lib/graphql-api-provider';
import { Duration, Stack, Token } from '@aws-cdk/core';
import { SearchableDataSource } from './cdk-compat/searchable-datasource';
import {
  BaseDataSource,
  CfnResolver,
  DataSourceOptions,
  DynamoDbDataSource,
  HttpDataSource,
  HttpDataSourceOptions,
  LambdaDataSource,
  NoneDataSource,
} from '@aws-cdk/aws-appsync';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { CfnFunction, Code, Function, IFunction, ILayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import { AppSyncFunctionConfiguration } from './appsync-function';
import { IRole } from '@aws-cdk/aws-iam';
import { InlineTemplate, S3MappingFunctionCode } from './cdk-compat/template-asset';
import { ResolverResourceIDs, toCamelCase } from 'graphql-transformer-common';
import { GraphQLApi } from './graphql-api';

export interface DefaultTransformHostOptions {
  readonly api: GraphQLApi;
}

export class DefaultTransformHost implements TransformHostProvider {
  private dataSources: Map<string, BaseDataSource> = new Map();
  private resolvers: Map<string, CfnResolver> = new Map();
  private api: GraphQLApi;

  public constructor(options: DefaultTransformHostOptions) {
    this.api = options.api;
  }

  public setAPI(api: GraphQLApi): void {
    this.api = api;
  }

  public hasDataSource(name: string): boolean {
    return this.dataSources.has(name);
  }
  public getDataSource = (name: string): BaseDataSource | void => {
    if (this.hasDataSource(name)) {
      return this.dataSources.get(name);
    }
  };

  public hasResolver = (typeName: string, fieldName: string) => {
    return this.resolvers.has(`${typeName}:${fieldName}`);
  };

  public getResolver = (typeName: string, fieldName: string): CfnResolver | void => {
    if (this.resolvers.has(`${typeName}:${fieldName}`)) {
      return this.resolvers.get(`${typeName}:${fieldName}`);
    }
  };

  addSearchableDataSource(
    name: string,
    awsRegion: string,
    endpoint: string,
    options?: SearchableDataSourceOptions,
    stack?: Stack,
  ): SearchableDataSource {
    if (this.dataSources.has(name)) {
      throw new Error(`DataSource ${name} already exists in the API`);
    }
    const data = this.doAddSearchableDataSource(name, endpoint, awsRegion, options, stack);
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

  public addDynamoDbDataSource(name: string, table: ITable, options?: DynamoDbDataSourceOptions, stack?: Stack): DynamoDbDataSource {
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
    const fn = new AppSyncFunctionConfiguration(stack || this.api, name, {
      api: this.api,
      dataSource: dataSource || dataSourceName,
      requestMappingTemplate,
      responseMappingTemplate,
    });
    return fn;
  }

  public addResolver(
    typeName: string,
    fieldName: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
    resolverLogicalId?: string,
    dataSourceName?: string,
    pipelineConfig?: string[],
    stack?: Stack,
  ): CfnResolver {
    if (dataSourceName && !Token.isUnresolved(dataSourceName) && !this.dataSources.has(dataSourceName)) {
      throw new Error(`DataSource ${dataSourceName} is missing in the API`);
    }

    const requestTemplateLocation = requestMappingTemplate.bind(this.api);
    const responseTemplateLocation = responseMappingTemplate.bind(this.api);
    const resolverName = toCamelCase([typeName, fieldName, 'Resolver']);
    const resourceId = resolverLogicalId ?? ResolverResourceIDs.ResolverResourceID(typeName, fieldName);

    if (dataSourceName) {
      const dataSource = this.dataSources.get(dataSourceName);
      const resolver = new CfnResolver(stack || this.api, resolverName, {
        apiId: this.api.apiId,
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
      resolver.overrideLogicalId(resourceId);
      this.api.addSchemaDependency(resolver);
      return resolver;
    } else if (pipelineConfig) {
      const resolver = new CfnResolver(stack || this.api, resolverName, {
        apiId: this.api.apiId,
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
      resolver.overrideLogicalId(resourceId);
      this.api.addSchemaDependency(resolver);
      this.resolvers.set(`${typeName}:${fieldName}`, resolver);
      return resolver;
    } else {
      throw new Error('Resolver needs either dataSourceName or pipelineConfig to be passed');
    }
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
    timeout?: Duration,
    stack?: Stack,
  ): IFunction {
    const dummycode = `if __name__ == "__main__":`; // assing dummy code so as to be overriden later
    const fn = new Function(stack || this.api, functionName, {
      code: Code.fromInline(dummycode),
      handler: handlerName,
      runtime,
      role,
      layers,
      environment,
      timeout,
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
   *
   * @param id The data source's id
   * @param options optional configuration for data source
   * @param stack  Stack to which this datasource needs to mapped to
   */
  protected doAddNoneDataSource(id: string, options?: DataSourceOptions, stack?: Stack): NoneDataSource {
    return new NoneDataSource(stack ?? this.api, id, {
      api: this.api,
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
  protected doAddDynamoDbDataSource(id: string, table: ITable, options?: DynamoDbDataSourceOptions, stack?: Stack): DynamoDbDataSource {
    return new DynamoDbDataSource(stack ?? this.api, id, {
      api: this.api,
      table,
      name: options?.name,
      description: options?.description,
      serviceRole: options?.serviceRole,
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
    return new HttpDataSource(stack ?? this.api, id, {
      api: this.api,
      endpoint,
      name: options?.name,
      description: options?.description,
      authorizationConfig: options?.authorizationConfig,
    });
  }

  /**
   * add a new searchable data source to this API
   *
   * @param id The data source's id
   * @param endpoint The searchable endpoint
   * @param region The searchable datasource region
   * @param options The optional configuration for this data source
   * @param stack Stack to which the searchable datasource needs to be created in
   */
  protected doAddSearchableDataSource(
    id: string,
    endpoint: string,
    region: string,
    options?: SearchableDataSourceOptions,
    stack?: Stack,
  ): SearchableDataSource {
    return new SearchableDataSource(stack ?? this.api, id, {
      api: this.api,
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
    return new LambdaDataSource(stack || this.api, id, {
      api: this.api,
      lambdaFunction,
      name: options?.name,
      description: options?.description,
    });
  }
}
