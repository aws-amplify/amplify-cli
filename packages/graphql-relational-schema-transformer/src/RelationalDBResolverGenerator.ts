import * as fs from 'fs-extra';

import { compoundExpression, forEach, iff, list, methodCall, obj, print, ref, ret, set, str } from 'graphql-mapping-template';
import { graphqlName, plurality, toUpper } from 'graphql-transformer-common';

import AppSync from 'cloudform-types/types/appSync';
import { DocumentNode } from 'graphql';
import { Fn } from 'cloudform-types';
import { RelationalDBMappingTemplate } from './RelationalDBMappingTemplate';
import { ResourceConstants } from './ResourceConstants';
import { TemplateContext } from './RelationalDBSchemaTransformer';

const s3BaseUrl = 's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/${ResolverFileName}';
const resolverFileName = 'ResolverFileName';

const rdsResponseErrorMessage = 'Invalid response from RDS DataSource. See info for the full response.';
const rdsResponseErrorType = 'InvalidResponse';
/**
 * This Class is responsible for Generating the RDS Resolvers based on the
 * GraphQL Schema + Metadata of the RDS Cluster (i.e. Primary Keys for Tables).
 *
 * It will generate the CRUDL+Q (Create, Retrieve, Update, Delete, List + Queries) Resolvers as
 * Cloudform Resources so that they may be added on to the base template that the
 * RelationDBTemplateGenerator creates.
 */
export class RelationalDBResolverGenerator {
  document: DocumentNode;
  typePrimaryKeyMap: Map<string, string>;
  stringFieldMap: Map<string, string[]>;
  intFieldMap: Map<string, string[]>;
  resolverFilePath: string;
  typePrimaryKeyTypeMap: Map<string, string>;

  constructor(context: TemplateContext) {
    this.document = context.schemaDoc;
    this.typePrimaryKeyMap = context.typePrimaryKeyMap;
    this.stringFieldMap = context.stringFieldMap;
    this.intFieldMap = context.intFieldMap;
    this.typePrimaryKeyTypeMap = context.typePrimaryKeyTypeMap;
  }

  /**
   * Creates the CRUDL+Q Resolvers as a Map of Cloudform Resources. The output can then be
   * merged with an existing Template's map of Resources.
   */
  public createRelationalResolvers(resolverFilePath: string) {
    let resources = {};
    this.resolverFilePath = resolverFilePath;
    this.typePrimaryKeyMap.forEach((value: string, key: string) => {
      const resourceName = key.replace(/[^A-Za-z0-9]/g, '');
      resources = {
        ...resources,
        ...{ [resourceName + 'CreateResolver']: this.makeCreateRelationalResolver(key) },
        ...{ [resourceName + 'GetResolver']: this.makeGetRelationalResolver(key) },
        ...{ [resourceName + 'UpdateResolver']: this.makeUpdateRelationalResolver(key) },
        ...{ [resourceName + 'DeleteResolver']: this.makeDeleteRelationalResolver(key) },
        ...{ [resourceName + 'ListResolver']: this.makeListRelationalResolver(key) },
      };
      // TODO: Add Guesstimate Query Resolvers
    });

    return resources;
  }

  /**
   * Private Helpers to Generate the CFN Spec for the Resolver Resources
   */

  /**
   * Creates and returns the CFN Spec for the 'Create' Resolver Resource provided
   * a GraphQL Type as the input
   *
   * @param type - the graphql type for which the create resolver will be created
   * @param mutationTypeName - will be 'Mutation'
   */
  private makeCreateRelationalResolver(type: string, mutationTypeName: string = 'Mutation') {
    const tableName = this.getTableName(type);
    const operationType = GRAPHQL_RESOLVER_OPERATION.Create;
    const fieldName = this.getFieldName(type, operationType);
    const createSql = this.generateInsertStatement(type);
    const selectSql = this.generateSelectByPrimaryKeyStatement(type, operationType);
    const reqFileName = `${mutationTypeName}.${fieldName}.req.vtl`;
    const resFileName = `${mutationTypeName}.${fieldName}.res.vtl`;

    const reqTemplate = print(
      compoundExpression([
        set(ref('cols'), list([])),
        set(ref('vals'), list([])),
        forEach(ref('entry'), ref(`ctx.args.create${tableName}Input.keySet()`), [
          set(ref('discard'), ref(`cols.add($entry)`)),
          set(ref('discard'), ref(`vals.add("'$ctx.args.create${tableName}Input[$entry]'")`)),
        ]),
        set(ref('valStr'), ref('vals.toString().replace("[","(").replace("]",")")')),
        set(ref('colStr'), ref('cols.toString().replace("[","(").replace("]",")")')),
        RelationalDBMappingTemplate.rdsQuery({
          statements: list([str(createSql), str(selectSql)]),
        }),
      ]),
    );

    const resTemplate = print(ref('utils.toJson($utils.parseJson($utils.rds.toJsonString($ctx.result))[1][0])'));

    fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
    fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

    let resolver = new AppSync.Resolver({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
      TypeName: mutationTypeName,
      FieldName: fieldName,
      RequestMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: reqFileName,
      }),
      ResponseMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: resFileName,
      }),
    }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource]);
    return resolver;
  }

  /**
   * Creates and Returns the CFN Spec for the 'Get' Resolver Resource provided
   * a GraphQL type
   *
   * @param type - the graphql type for which the get resolver will be created
   * @param queryTypeName  - will be 'Query'
   */
  private makeGetRelationalResolver(type: string, queryTypeName: string = 'Query') {
    const operationType = GRAPHQL_RESOLVER_OPERATION.Get;
    const fieldName = this.getFieldName(type, operationType);
    const selectSql = this.generateSelectByPrimaryKeyStatement(type, operationType);
    const reqFileName = `${queryTypeName}.${fieldName}.req.vtl`;
    const resFileName = `${queryTypeName}.${fieldName}.res.vtl`;

    const reqTemplate = print(
      compoundExpression([
        RelationalDBMappingTemplate.rdsQuery({
          statements: list([str(selectSql)]),
        }),
      ]),
    );
    const resTemplate: string = print(
      compoundExpression([
        set(ref('output'), ref('utils.rds.toJsonObject($ctx.result)')),
        iff(
          ref('output.isEmpty()'),
          methodCall(ref('util.error'), str(rdsResponseErrorMessage), str(rdsResponseErrorType), obj({}), ref('output')),
        ),
        set(ref('output'), ref('output[0]')),
        iff(ref('output.isEmpty()'), ret()),
        methodCall(ref('utils.toJson'), ref('output[0]')),
      ]),
    );

    fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
    fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

    let resolver = new AppSync.Resolver({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
      FieldName: fieldName,
      TypeName: queryTypeName,
      RequestMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: reqFileName,
      }),
      ResponseMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: resFileName,
      }),
    }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource]);
    return resolver;
  }

  /**
   * Creates and Returns the CFN Spec for the 'Update' Resolver Resource provided
   * a GraphQL type
   *
   * @param type - the graphql type for which the update resolver will be created
   * @param mutationTypeName - will be 'Mutation'
   */
  private makeUpdateRelationalResolver(type: string, mutationTypeName: string = 'Mutation') {
    const tableName = this.getTableName(type);
    const operationType = GRAPHQL_RESOLVER_OPERATION.Update;
    const fieldName = this.getFieldName(type, operationType);
    const updateSql = this.generateUpdateStatement(type);
    const selectSql = this.generateSelectByPrimaryKeyStatement(type, operationType);
    const reqFileName = `${mutationTypeName}.${fieldName}.req.vtl`;
    const resFileName = `${mutationTypeName}.${fieldName}.res.vtl`;

    const reqTemplate = print(
      compoundExpression([
        set(ref('updateList'), obj({})),
        forEach(ref('entry'), ref(`ctx.args.update${tableName}Input.keySet()`), [
          set(ref('discard'), ref(`updateList.put($entry, "'$ctx.args.update${tableName}Input[$entry]'")`)),
        ]),
        set(ref('update'), ref(`updateList.toString().replace("{","").replace("}","")`)),
        RelationalDBMappingTemplate.rdsQuery({
          statements: list([str(updateSql), str(selectSql)]),
        }),
      ]),
    );

    const resTemplate: string = print(
      compoundExpression([
        set(ref('output'), ref('utils.rds.toJsonObject($ctx.result)')),
        iff(
          ref('output.length() < 2'),
          methodCall(ref('util.error'), str(rdsResponseErrorMessage), str(rdsResponseErrorType), obj({}), ref('output')),
        ),
        set(ref('output'), ref('output[1]')),
        iff(ref('output.isEmpty()'), ret()),
        methodCall(ref('utils.toJson'), ref('output[0]')),
      ]),
    );

    fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
    fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

    let resolver = new AppSync.Resolver({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
      TypeName: mutationTypeName,
      FieldName: fieldName,
      RequestMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: reqFileName,
      }),
      ResponseMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: resFileName,
      }),
    }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource]);
    return resolver;
  }

  /**
   * Creates and Returns the CFN Spec for the 'Delete' Resolver Resource provided
   * a GraphQL type
   *
   * @param type - the graphql type for which the delete resolver will be created
   * @param mutationTypeName - will be 'Mutation'
   */
  private makeDeleteRelationalResolver(type: string, mutationTypeName: string = 'Mutation') {
    const operationType = GRAPHQL_RESOLVER_OPERATION.Delete;
    const fieldName = this.getFieldName(type, operationType);
    const selectSql = this.generateSelectByPrimaryKeyStatement(type, operationType);
    const deleteSql = this.generateDeleteStatement(type);
    const reqFileName = `${mutationTypeName}.${fieldName}.req.vtl`;
    const resFileName = `${mutationTypeName}.${fieldName}.res.vtl`;
    const reqTemplate = print(
      compoundExpression([
        RelationalDBMappingTemplate.rdsQuery({
          statements: list([str(selectSql), str(deleteSql)]),
        }),
      ]),
    );
    const resTemplate: string = print(
      compoundExpression([
        set(ref('output'), ref('utils.rds.toJsonObject($ctx.result)')),
        iff(
          ref('output.isEmpty()'),
          methodCall(ref('util.error'), str(rdsResponseErrorMessage), str(rdsResponseErrorType), obj({}), ref('output')),
        ),
        set(ref('output'), ref('output[0]')),
        iff(ref('output.isEmpty()'), ret()),
        methodCall(ref('utils.toJson'), ref('output[0]')),
      ]),
    );

    fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
    fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

    let resolver = new AppSync.Resolver({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
      TypeName: mutationTypeName,
      FieldName: fieldName,
      RequestMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: reqFileName,
      }),
      ResponseMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: resFileName,
      }),
    }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource]);

    return resolver;
  }

  /**
   * Creates and Returns the CFN Spec for the 'List' Resolver Resource provided
   * a GraphQL type
   *
   * @param type - the graphql type for which the list resolver will be created
   * @param queryTypeName - will be 'Query'
   */
  private makeListRelationalResolver(type: string, queryTypeName: string = 'Query') {
    const fieldName = graphqlName(GRAPHQL_RESOLVER_OPERATION.List + plurality(toUpper(type)));
    const selectSql = this.generateSelectStatement(type);
    const reqFileName = `${queryTypeName}.${fieldName}.req.vtl`;
    const resFileName = `${queryTypeName}.${fieldName}.res.vtl`;
    const reqTemplate = print(
      RelationalDBMappingTemplate.rdsQuery({
        statements: list([str(selectSql)]),
      }),
    );
    const resTemplate = print(ref('utils.toJson($utils.rds.toJsonObject($ctx.result)[0])'));

    fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
    fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

    let resolver = new AppSync.Resolver({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
      TypeName: queryTypeName,
      FieldName: fieldName,
      RequestMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: reqFileName,
      }),
      ResponseMappingTemplateS3Location: Fn.Sub(s3BaseUrl, {
        [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        [resolverFileName]: resFileName,
      }),
    }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource]);

    return resolver;
  }

  /**
   * Generate the table name to use on sql statements
   *
   * @param type - the graphql type to infer the table name
   * @returns string with the table name
   */
  private getTableName(type: string): string {
    return toUpper(type);
  }

  /**
   * Using the CRUDL+Q and the graphql type generate the graphql operation name
   *
   * @param type - the graphql type to infer the table name
   * @param operationType The CRUDL+Q (Create, Retrieve, Update, Delete, List + Queries) operation name
   *
   * @returns string with the graphql operation name
   */
  private getFieldName(type: string, operationType: GRAPHQL_RESOLVER_OPERATION): string {
    const tableName = this.getTableName(type);
    return graphqlName(`${operationType}${tableName}`);
  }

  /**
   * Generate the primary key column name to use on sql statements
   *
   * @param type - the graphql type to get the primary key
   * @returns string with the table name
   */
  private getTablePrimaryKey(type: string): string {
    return this.typePrimaryKeyMap.get(type);
  }

  /**
   * Check if the type of the primary key is string to apply different transformation on sql statements
   *
   * @param type - the graphql type to check
   * @returns boolean true if the primary key is a string type, otherwise false
   */
  private isPrimaryKeyAStringType(type: string): boolean {
    return this.typePrimaryKeyTypeMap.get(type).includes('String');
  }

  /**
   * Generate the select sql statement to retrieve all rows
   *
   * @param type - the graphql type
   * @returns string with the sql statement
   */
  private generateSelectStatement(type: string): string {
    const tableName = this.getTableName(type);
    return `SELECT * FROM ${tableName}`;
  }

  /**
   * Generate the select sql statement filter by the primary key
   *
   * @param type - the graphql type
   * @param operationType The CRUDL+Q (Create, Retrieve, Update, Delete, List + Queries) operation name
   * @returns string with the sql statement
   */
  private generateSelectByPrimaryKeyStatement(type: string, operationType: GRAPHQL_RESOLVER_OPERATION): string {
    const tableName = this.getTableName(type);
    const primaryKey = this.getTablePrimaryKey(type);
    const hasToAppendOperationInput = ![GRAPHQL_RESOLVER_OPERATION.Get, GRAPHQL_RESOLVER_OPERATION.Delete].includes(operationType);
    const operationInput = hasToAppendOperationInput ? `${operationType}${tableName}Input.` : '';
    if (this.isPrimaryKeyAStringType(type)) {
      return `SELECT * FROM ${tableName} WHERE ${primaryKey}=\'$ctx.args.${operationInput}${primaryKey}\'`;
    }
    return `SELECT * FROM ${tableName} WHERE ${primaryKey}=$ctx.args.${operationInput}${primaryKey}`;
  }

  /**
   * Generate the insert sql statement
   *
   * @param type - the graphql type
   * @returns string with the sql statement
   */
  private generateInsertStatement(type: string): string {
    const tableName = this.getTableName(type);
    return `INSERT INTO ${tableName} $colStr VALUES $valStr`;
  }

  /**
   * Generate the update sql statement
   *
   * @param type - the graphql type
   * @returns string with the sql statement
   */
  private generateUpdateStatement(type: string): string {
    const tableName = this.getTableName(type);
    const primaryKey = this.getTablePrimaryKey(type);
    if (this.isPrimaryKeyAStringType(type)) {
      return `UPDATE ${type} SET $update WHERE ${primaryKey}=\'$ctx.args.update${tableName}Input.${primaryKey}\'`;
    }
    return `UPDATE ${type} SET $update WHERE ${primaryKey}=$ctx.args.update${tableName}Input.${primaryKey}}`;
  }

  /**
   * Generate the delete sql statement
   *
   * @param type - the graphql type
   * @returns string with the sql statement
   */
  private generateDeleteStatement(type: string): string {
    const primaryKey = this.getTablePrimaryKey(type);
    if (this.isPrimaryKeyAStringType(type)) {
      return `DELETE FROM ${type} WHERE ${primaryKey}=\'$ctx.args.${primaryKey}\'`;
    }
    return `DELETE FROM ${type} WHERE ${primaryKey}=$ctx.args.${primaryKey}`;
  }
}

enum GRAPHQL_RESOLVER_OPERATION {
  Create = 'create',
  Delete = 'delete',
  Get = 'get',
  List = 'list',
  Update = 'update',
}
