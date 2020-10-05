import { Construct } from '@aws-cdk/core';
import {
  CfnFunctionConfiguration,
  GraphqlApi as GraphQLApi,
  BaseDataSource,
  MappingTemplate,
  BackedDataSource,
} from '@aws-cdk/aws-appsync';
import { TemplateProvider } from '@aws-amplify/graphql-transformer-interfaces';
export interface BaseFunctionConfigurationProps {
  /**
   * The request mapping template for this resolver
   *
   * @default - No mapping template
   */
  readonly requestMappingTemplate: TemplateProvider;
  /**
   * The response mapping template for this resolver
   *
   * @default - No mapping template
   */
  readonly responseMappingTemplate: TemplateProvider;

  readonly description?: string;
}

/**
 * Additional properties for an AppSync resolver like GraphQL API reference and datasource
 */
export interface FunctionConfigurationProps extends BaseFunctionConfigurationProps {
  /**
   * The API this resolver is attached to
   */
  readonly api: GraphQLApi;
  /**
   * The data source this resolver is using
   *
   * @default - No datasource
   */
  readonly dataSource: BaseDataSource | string;
}

export class AppSyncFunctionConfiguration extends Construct {
  /**
   * the ARN of the resolver
   */
  public readonly arn: string;
  public readonly functionId: string;

  private function: CfnFunctionConfiguration;

  constructor(scope: Construct, id: string, props: FunctionConfigurationProps) {
    super(scope, id);

    const requestTemplate = props.requestMappingTemplate.bind(this);
    const responseTemplate = props.responseMappingTemplate.bind(this);
    this.function = new CfnFunctionConfiguration(this, `${id}AppSyncFunction`, {
      name: id,
      apiId: props.api.apiId,
      functionVersion: '2018-05-29',
      description: props.description,
      dataSourceName: props.dataSource instanceof BaseDataSource ? props.dataSource.ds.attrName : props.dataSource,
      requestMappingTemplate: requestTemplate.s3Location.httpUrl,
      responseMappingTemplate: responseTemplate.s3Location.httpUrl,
    });

    props.api.addSchemaDependency(this.function);
    if (props.dataSource instanceof BackedDataSource) {
      this.function.addDependsOn(props.dataSource?.ds);
    }
    this.arn = this.function.attrFunctionArn;
    this.functionId = this.function.attrFunctionId;
  }
}
