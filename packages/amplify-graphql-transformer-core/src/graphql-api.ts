import { Construct, Stack, Token } from '@aws-cdk/core';
import {
  GraphqlApi as CdkGraphQLApi,
  GraphqlApiProps,
  CfnResolver,
  DynamoDbDataSource,
  HttpDataSource,
  BaseDataSource,
  NoneDataSource,
  LambdaDataSource,
  DataSourceOptions,
  HttpDataSourceOptions,
} from '@aws-cdk/aws-appsync';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { IFunction } from '@aws-cdk/aws-lambda';
import { GraphQLApiProvider, TemplateProvider } from '@aws-amplify/graphql-transformer-interfaces';

import { AppSyncFunctionConfiguration } from './appsync-function';
import { TransformerSchema } from './cdk-compat/schema-asset';

export class GraphQLApi extends CdkGraphQLApi implements GraphQLApiProvider {
  private dataSources: Map<string, BaseDataSource> = new Map();
  constructor(scope: Construct, id: string, props: GraphqlApiProps) {
    super(scope, id, { schema: new TransformerSchema(), ...props });
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
    requestMappingTemplate: TemplateProvider,
    responseMappingTemplate: TemplateProvider,
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

  public addResolver(
    typeName: string,
    fieldName: string,
    requestMappingTemplate: TemplateProvider,
    responseMappingTemplate: TemplateProvider,
    dataSourceName?: string,
    pipelineConfig?: string[],
    stack?: Stack,
  ) {
    if (dataSourceName && !Token.isUnresolved(dataSourceName) && !this.dataSources.has(dataSourceName)) {
      throw new Error(`DataSource ${dataSourceName} is missing in the API`);
    }

    const requestTemplateLocation = requestMappingTemplate.bind(this).s3Location.httpUrl;
    const responseTemplateLocation = responseMappingTemplate.bind(this).s3Location.httpUrl;
    const resolverName = `${typeName}.${fieldName}Resolver`;
    if (dataSourceName) {
      const dataSource = this.dataSources.get(dataSourceName);

      const resolver = new CfnResolver(stack || this, resolverName, {
        apiId: this.apiId,
        fieldName: fieldName,
        typeName: typeName,
        kind: 'UNIT',
        dataSourceName: dataSource?.ds.attrName || dataSourceName,
        requestMappingTemplate: requestTemplateLocation,
        responseMappingTemplate: responseTemplateLocation,
      });
      this.addSchemaDependency(resolver);
      return resolver;
    } else if (pipelineConfig) {
      const resolver = new CfnResolver(stack || this, resolverName, {
        apiId: this.apiId,
        fieldName: fieldName,
        typeName: typeName,
        kind: 'PIPELINE',
        requestMappingTemplate: requestTemplateLocation,
        responseMappingTemplate: responseTemplateLocation,
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
}
