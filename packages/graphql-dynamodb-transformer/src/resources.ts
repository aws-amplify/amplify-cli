import { DynamoDB, AppSync, IAM, Fn, StringParameter, NumberParameter, Refs, IntrinsicFunction, DeletionPolicy } from 'cloudform-types';
import Output from 'cloudform-types/types/output';
import {
  DynamoDBMappingTemplate,
  printBlock,
  str,
  print,
  ref,
  obj,
  set,
  nul,
  ifElse,
  compoundExpression,
  qref,
  bool,
  equals,
  iff,
  raw,
  comment,
  forEach,
  list,
  and,
  RESOLVER_VERSION_ID,
  Expression,
} from 'graphql-mapping-template';
import {
  ResourceConstants,
  plurality,
  graphqlName,
  toUpper,
  ModelResourceIDs,
  SyncResourceIDs,
  getBaseType,
} from 'graphql-transformer-common';
import { plural } from 'pluralize';
import { SyncConfig, SyncUtils } from 'graphql-transformer-core';
import Template from 'cloudform-types/types/template';
import md5 from 'md5';
import { InputObjectTypeDefinitionNode } from 'graphql';

type MutationResolverInput = {
  type: string;
  syncConfig: SyncConfig;
  nameOverride?: string;
  mutationTypeName?: string;
  timestamps?: {
    createdAtField?: string;
    updatedAtField?: string;
  };
};

type MutationUpdateResolverInput = MutationResolverInput & {
  optionalNonNullableFields: string[];
};

export class ResourceFactory {
  public makeParams() {
    return {
      [ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS]: new NumberParameter({
        Description: 'The number of read IOPS the table should support.',
        Default: 5,
      }),
      [ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS]: new NumberParameter({
        Description: 'The number of write IOPS the table should support.',
        Default: 5,
      }),
      [ResourceConstants.PARAMETERS.DynamoDBBillingMode]: new StringParameter({
        Description: 'Configure @model types to create DynamoDB tables with PAY_PER_REQUEST or PROVISIONED billing modes.',
        Default: 'PAY_PER_REQUEST',
        AllowedValues: ['PAY_PER_REQUEST', 'PROVISIONED'],
      }),
      [ResourceConstants.PARAMETERS.DynamoDBEnablePointInTimeRecovery]: new StringParameter({
        Description: 'Whether to enable Point in Time Recovery on the table',
        Default: 'false',
        AllowedValues: ['true', 'false'],
      }),
      [ResourceConstants.PARAMETERS.DynamoDBEnableServerSideEncryption]: new StringParameter({
        Description: 'Enable server side encryption powered by KMS.',
        Default: 'true',
        AllowedValues: ['true', 'false'],
      }),
    };
  }

  /**
   * Creates the barebones template for an application.
   */
  public initTemplate(): Template {
    return {
      Parameters: this.makeParams(),
      Resources: {
        [ResourceConstants.RESOURCES.GraphQLAPILogicalID]: this.makeAppSyncAPI(),
      },
      Outputs: {
        [ResourceConstants.OUTPUTS.GraphQLAPIIdOutput]: this.makeAPIIDOutput(),
        [ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput]: this.makeAPIEndpointOutput(),
      },
      Conditions: {
        [ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling]: Fn.Equals(
          Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBBillingMode),
          'PAY_PER_REQUEST',
        ),

        [ResourceConstants.CONDITIONS.ShouldUsePointInTimeRecovery]: Fn.Equals(
          Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBEnablePointInTimeRecovery),
          'true',
        ),
        [ResourceConstants.CONDITIONS.ShouldUseServerSideEncryption]: Fn.Equals(
          Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBEnableServerSideEncryption),
          'true',
        ),
      },
    };
  }

  /**
   * Create the AppSync API.
   */
  public makeAppSyncAPI() {
    return new AppSync.GraphQLApi({
      Name: Fn.If(
        ResourceConstants.CONDITIONS.HasEnvironmentParameter,
        Fn.Join('-', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiName), Fn.Ref(ResourceConstants.PARAMETERS.Env)]),
        Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiName),
      ),
      AuthenticationType: 'API_KEY',
    });
  }

  public makeAppSyncSchema(schema: string) {
    return new AppSync.GraphQLSchema({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      Definition: schema,
    });
  }

  /**
   * Outputs
   */
  public makeAPIIDOutput(): Output {
    return {
      Description: 'Your GraphQL API ID.',
      Value: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      Export: {
        Name: Fn.Join(':', [Refs.StackName, 'GraphQLApiId']),
      },
    };
  }

  public makeAPIEndpointOutput(): Output {
    return {
      Description: 'Your GraphQL API endpoint.',
      Value: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'GraphQLUrl'),
      Export: {
        Name: Fn.Join(':', [Refs.StackName, 'GraphQLApiEndpoint']),
      },
    };
  }

  public makeTableStreamArnOutput(resourceId: string): Output {
    return {
      Description: 'Your DynamoDB table StreamArn.',
      Value: Fn.GetAtt(resourceId, 'StreamArn'),
      Export: {
        Name: Fn.Join(':', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId), 'GetAtt', resourceId, 'StreamArn']),
      },
    };
  }

  public makeDataSourceOutput(resourceId: string): Output {
    return {
      Description: 'Your model DataSource name.',
      Value: Fn.GetAtt(resourceId, 'Name'),
      Export: {
        Name: Fn.Join(':', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId), 'GetAtt', resourceId, 'Name']),
      },
    };
  }

  public makeTableNameOutput(resourceId: string): Output {
    return {
      Description: 'Your DynamoDB table name.',
      Value: Fn.Ref(resourceId),
      Export: {
        Name: Fn.Join(':', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId), 'GetAtt', resourceId, 'Name']),
      },
    };
  }

  /**
   * Create a DynamoDB table for a specific type.
   */
  public makeModelTable(
    typeName: string,
    hashKey: string = 'id',
    rangeKey?: string,
    deletionPolicy: DeletionPolicy = DeletionPolicy.Delete,
    isSyncEnabled: boolean = false,
  ) {
    const keySchema =
      hashKey && rangeKey
        ? [
            {
              AttributeName: hashKey,
              KeyType: 'HASH',
            },
            {
              AttributeName: rangeKey,
              KeyType: 'RANGE',
            },
          ]
        : [{ AttributeName: hashKey, KeyType: 'HASH' }];
    const attributeDefinitions =
      hashKey && rangeKey
        ? [
            {
              AttributeName: hashKey,
              AttributeType: 'S',
            },
            {
              AttributeName: rangeKey,
              AttributeType: 'S',
            },
          ]
        : [{ AttributeName: hashKey, AttributeType: 'S' }];
    return new DynamoDB.Table({
      TableName: this.dynamoDBTableName(typeName),
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
      BillingMode: Fn.If(ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling, 'PAY_PER_REQUEST', Refs.NoValue),
      ProvisionedThroughput: Fn.If(ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling, Refs.NoValue, {
        ReadCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
        WriteCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS),
      }) as any,
      SSESpecification: {
        SSEEnabled: Fn.If(ResourceConstants.CONDITIONS.ShouldUseServerSideEncryption, true, false),
      },
      PointInTimeRecoverySpecification: Fn.If(
        ResourceConstants.CONDITIONS.ShouldUsePointInTimeRecovery,
        {
          PointInTimeRecoveryEnabled: true,
        },
        Refs.NoValue,
      ) as any,
      ...(isSyncEnabled && {
        TimeToLiveSpecification: SyncUtils.syncTTLConfig(),
      }),
    }).deletionPolicy(deletionPolicy);
  }

  private dynamoDBTableName(typeName: string): IntrinsicFunction {
    return Fn.If(
      ResourceConstants.CONDITIONS.HasEnvironmentParameter,
      Fn.Join('-', [
        typeName,
        Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
        Fn.Ref(ResourceConstants.PARAMETERS.Env),
      ]),
      Fn.Join('-', [typeName, Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')]),
    );
  }

  /**
   * Create a single role that has access to all the resources created by the
   * transform.
   * @param name  The name of the IAM role to create.
   */
  public makeIAMRole(typeName: string, syncConfig?: SyncConfig) {
    return new IAM.Role({
      RoleName: Fn.If(
        ResourceConstants.CONDITIONS.HasEnvironmentParameter,
        Fn.Join('-', [
          typeName.slice(0, 14) + md5(typeName).slice(15, 21), // max of 64. 64-10-26-4-3 = 21
          'role', // 4
          Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
          Fn.Ref(ResourceConstants.PARAMETERS.Env), // 10
        ]),
        Fn.Join('-', [
          typeName.slice(0, 24) + md5(typeName).slice(25, 31), // max of 64. 64-26-4-3 = 31
          'role',
          Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
        ]),
      ),
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'appsync.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        new IAM.Role.Policy({
          PolicyName: 'DynamoDBAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                  'dynamodb:PutItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:GetItem',
                  'dynamodb:Scan',
                  'dynamodb:Query',
                  'dynamodb:UpdateItem',
                ],
                Resource: [
                  Fn.Sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}', {
                    tablename: this.dynamoDBTableName(typeName),
                  }),
                  Fn.Sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}/*', {
                    tablename: this.dynamoDBTableName(typeName),
                  }),
                  ...(syncConfig
                    ? [
                        Fn.Sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}', {
                          tablename: Fn.If(
                            ResourceConstants.CONDITIONS.HasEnvironmentParameter,
                            Fn.Join('-', [
                              SyncResourceIDs.syncTableName,
                              Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                              Fn.Ref(ResourceConstants.PARAMETERS.Env),
                            ]),
                            Fn.Join('-', [
                              SyncResourceIDs.syncTableName,
                              Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                            ]),
                          ),
                        }),
                        Fn.Sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}/*', {
                          tablename: Fn.If(
                            ResourceConstants.CONDITIONS.HasEnvironmentParameter,
                            Fn.Join('-', [
                              SyncResourceIDs.syncTableName,
                              Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                              Fn.Ref(ResourceConstants.PARAMETERS.Env),
                            ]),
                            Fn.Join('-', [
                              SyncResourceIDs.syncTableName,
                              Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                            ]),
                          ),
                        }),
                      ]
                    : []),
                ],
              },
            ],
          },
        }),
        ...(syncConfig && SyncUtils.isLambdaSyncConfig(syncConfig)
          ? [SyncUtils.createSyncLambdaIAMPolicy(syncConfig.LambdaConflictHandler)]
          : []),
      ],
    });
  }

  /**
   * Given the name of a data source and optional logical id return a CF
   * spec for a data source pointing to the dynamodb table.
   */
  public makeDynamoDBDataSource(tableId: string, iamRoleLogicalID: string, typeName: string, isSyncEnabled: boolean = false) {
    return new AppSync.DataSource({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      Name: tableId,
      Type: 'AMAZON_DYNAMODB',
      ServiceRoleArn: Fn.GetAtt(iamRoleLogicalID, 'Arn'),
      DynamoDBConfig: {
        AwsRegion: Refs.Region,
        TableName: this.dynamoDBTableName(typeName),
        ...(isSyncEnabled && {
          DeltaSyncConfig: SyncUtils.syncDataSourceConfig(),
          Versioned: true,
        }),
      },
    }).dependsOn([iamRoleLogicalID]);
  }

  /**
   * Create a resolver that creates an item in DynamoDB.
   * @param type
   */
  public makeCreateResolver({ type, nameOverride, syncConfig, mutationTypeName = 'Mutation' }: MutationResolverInput) {
    const fieldName = nameOverride ? nameOverride : graphqlName('create' + toUpper(type));
    const isSyncEnabled = syncConfig ? true : false;
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: mutationTypeName,
      RequestMappingTemplate: printBlock('Prepare DynamoDB PutItem Request')(
        compoundExpression([
          qref(`$context.args.input.put("__typename", "${type}")`),
          this.addDefaultConditionExpression('create'),
          iff(
            ref('context.args.condition'),
            compoundExpression([
              set(ref('condition.expressionValues'), obj({})),
              set(
                ref('conditionFilterExpressions'),
                raw('$util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition))'),
              ),
              // tslint:disable-next-line
              qref(`$condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression")`),
              qref(`$condition.expressionNames.putAll($conditionFilterExpressions.expressionNames)`),
              qref(`$condition.expressionValues.putAll($conditionFilterExpressions.expressionValues)`),
            ]),
          ),
          iff(
            and([ref('condition.expressionValues'), raw('$condition.expressionValues.size() == 0')]),
            set(
              ref('condition'),
              obj({
                expression: ref('condition.expression'),
                expressionNames: ref('condition.expressionNames'),
              }),
            ),
          ),
          DynamoDBMappingTemplate.putItem({
            key: ifElse(
              ref(ResourceConstants.SNIPPETS.ModelObjectKey),
              raw(`$util.toJson(\$${ResourceConstants.SNIPPETS.ModelObjectKey})`),
              obj({
                id: raw(`$util.dynamodb.toDynamoDBJson($ctx.args.input.id)`),
              }),
              true,
            ),
            attributeValues: ref('util.dynamodb.toMapValuesJson($context.args.input)'),
            condition: ref('util.toJson($condition)'),
          }),
        ]),
      ),
      ResponseMappingTemplate: print(DynamoDBMappingTemplate.dynamoDBResponse(isSyncEnabled)),
      ...(syncConfig && { SyncConfig: SyncUtils.syncResolverConfig(syncConfig) }),
    });
  }

  public initalizeDefaultInputForCreateMutation(input: InputObjectTypeDefinitionNode, timestamps): string {
    const hasDefaultIdField = input.fields?.find(field => field.name.value === 'id' && ['ID', 'String'].includes(getBaseType(field.type)));
    return printBlock('Set default values')(
      compoundExpression([
        ...(hasDefaultIdField ? [qref(`$context.args.input.put("id", $util.defaultIfNull($ctx.args.input.id, $util.autoId()))`)] : []),
        ...(timestamps && (timestamps.createdAtField || timestamps.updatedAtField)
          ? [set(ref('createdAt'), ref('util.time.nowISO8601()'))]
          : []),
        ...(timestamps && timestamps.createdAtField
          ? [
              comment(`Automatically set the createdAt timestamp.`),
              qref(
                `$context.args.input.put("${timestamps.createdAtField}", $util.defaultIfNull($ctx.args.input.${timestamps.createdAtField}, $createdAt))`,
              ),
            ]
          : []),
        ...(timestamps && timestamps.updatedAtField
          ? [
              comment(`Automatically set the updatedAt timestamp.`),
              qref(
                `$context.args.input.put("${timestamps.updatedAtField}", $util.defaultIfNull($ctx.args.input.${timestamps.updatedAtField}, $createdAt))`,
              ),
            ]
          : []),
      ]),
    );
  }

  public makeUpdateResolver({
    type,
    nameOverride,
    syncConfig,
    mutationTypeName = 'Mutation',
    timestamps,
    optionalNonNullableFields,
  }: MutationUpdateResolverInput) {
    const fieldName = nameOverride ? nameOverride : graphqlName(`update` + toUpper(type));
    const isSyncEnabled = syncConfig ? true : false;
    const optionalNonNullableExpression: Expression[] = optionalNonNullableFields.map(str);

    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: mutationTypeName,
      RequestMappingTemplate: print(
        compoundExpression([
          set(ref('optionalNonNullableFields'), list(optionalNonNullableExpression)),
          forEach(ref('field'), ref('optionalNonNullableFields'), [
            iff(
              and([ref('context.arguments.input.keySet().contains($field)'), ref('util.isNull($context.args.input.get($field))')]),
              ref('util.error("An argument you marked as Non-Null is set to Null in the query or the body of your request.")'),
            ),
          ]),

          ifElse(
            raw(`$${ResourceConstants.SNIPPETS.AuthCondition} && $${ResourceConstants.SNIPPETS.AuthCondition}.expression != ""`),
            compoundExpression([
              set(ref('condition'), ref(ResourceConstants.SNIPPETS.AuthCondition)),
              ifElse(
                ref(ResourceConstants.SNIPPETS.ModelObjectKey),
                forEach(ref('entry'), ref(`${ResourceConstants.SNIPPETS.ModelObjectKey}.entrySet()`), [
                  qref('$condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)")'),
                  qref('$condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key")'),
                ]),
                compoundExpression([
                  qref('$condition.put("expression", "$condition.expression AND attribute_exists(#id)")'),
                  qref('$condition.expressionNames.put("#id", "id")'),
                ]),
              ),
            ]),
            this.addDefaultConditionExpression('update'),
          ),
          ...(timestamps && timestamps.updatedAtField
            ? [
                comment(`Automatically set the updatedAt timestamp.`),
                qref(
                  `$context.args.input.put("${timestamps.updatedAtField}", $util.defaultIfNull($ctx.args.input.${timestamps.updatedAtField}, $util.time.nowISO8601()))`,
                ),
              ]
            : []),
          qref(`$context.args.input.put("__typename", "${type}")`),
          comment('Update condition if type is @versioned'),
          iff(
            ref(ResourceConstants.SNIPPETS.VersionedCondition),
            compoundExpression([
              // tslint:disable-next-line
              qref(
                `$condition.put("expression", "($condition.expression) AND $${ResourceConstants.SNIPPETS.VersionedCondition}.expression")`,
              ),
              qref(`$condition.expressionNames.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionNames)`),
              qref(`$condition.expressionValues.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionValues)`),
            ]),
          ),
          iff(
            ref('context.args.condition'),
            compoundExpression([
              set(
                ref('conditionFilterExpressions'),
                raw('$util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition))'),
              ),
              // tslint:disable-next-line
              qref(`$condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression")`),
              qref(`$condition.expressionNames.putAll($conditionFilterExpressions.expressionNames)`),
              qref(`$condition.expressionValues.putAll($conditionFilterExpressions.expressionValues)`),
            ]),
          ),
          iff(
            and([ref('condition.expressionValues'), raw('$condition.expressionValues.size() == 0')]),
            set(
              ref('condition'),
              obj({
                expression: ref('condition.expression'),
                expressionNames: ref('condition.expressionNames'),
              }),
            ),
          ),
          DynamoDBMappingTemplate.updateItem({
            key: ifElse(
              ref(ResourceConstants.SNIPPETS.ModelObjectKey),
              raw(`$util.toJson(\$${ResourceConstants.SNIPPETS.ModelObjectKey})`),
              obj({
                id: obj({ S: ref('util.toJson($context.args.input.id)') }),
              }),
              true,
            ),
            condition: ref('util.toJson($condition)'),
            objectKeyVariable: ResourceConstants.SNIPPETS.ModelObjectKey,
            nameOverrideMap: ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap,
            isSyncEnabled,
          }),
        ]),
      ),
      ResponseMappingTemplate: print(DynamoDBMappingTemplate.dynamoDBResponse(isSyncEnabled)),
      ...(syncConfig && { SyncConfig: SyncUtils.syncResolverConfig(syncConfig) }),
    });
  }

  /**
   * Create a resolver that creates an item in DynamoDB.
   * @param type
   */
  public makeGetResolver(type: string, nameOverride?: string, isSyncEnabled: boolean = false, queryTypeName: string = 'Query') {
    const fieldName = nameOverride ? nameOverride : graphqlName('get' + toUpper(type));
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: queryTypeName,
      RequestMappingTemplate: print(
        DynamoDBMappingTemplate.getItem({
          key: ifElse(
            ref(ResourceConstants.SNIPPETS.ModelObjectKey),
            raw(`$util.toJson(\$${ResourceConstants.SNIPPETS.ModelObjectKey})`),
            obj({
              id: ref('util.dynamodb.toDynamoDBJson($ctx.args.id)'),
            }),
            true,
          ),
          isSyncEnabled,
        }),
      ),
      ResponseMappingTemplate: print(DynamoDBMappingTemplate.dynamoDBResponse(isSyncEnabled)),
    });
  }

  /**
   * Create a resolver that syncs local storage with cloud storage
   * @param type
   */
  public makeSyncResolver(type: string, queryTypeName: string = 'Query') {
    const fieldName = graphqlName('sync' + toUpper(plural(type)));
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: queryTypeName,
      RequestMappingTemplate: print(
        DynamoDBMappingTemplate.syncItem({
          filter: ifElse(ref('context.args.filter'), ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), nul()),
          limit: ref(`util.defaultIfNull($ctx.args.limit, ${ResourceConstants.DEFAULT_SYNC_QUERY_PAGE_LIMIT})`),
          lastSync: ref('util.toJson($util.defaultIfNull($ctx.args.lastSync, null))'),
          nextToken: ref('util.toJson($util.defaultIfNull($ctx.args.nextToken, null))'),
        }),
      ),
      ResponseMappingTemplate: print(DynamoDBMappingTemplate.dynamoDBResponse(true)),
    });
  }

  /**
   * Create a resolver that queries an item in DynamoDB.
   * @param type
   */
  public makeQueryResolver(type: string, nameOverride?: string, isSyncEnabled: boolean = false, queryTypeName: string = 'Query') {
    const fieldName = nameOverride ? nameOverride : graphqlName(`query${toUpper(type)}`);
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: queryTypeName,
      RequestMappingTemplate: print(
        compoundExpression([
          set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${ResourceConstants.DEFAULT_PAGE_LIMIT})`)),
          DynamoDBMappingTemplate.query({
            query: obj({
              expression: str('#typename = :typename'),
              expressionNames: obj({
                '#typename': str('__typename'),
              }),
              expressionValues: obj({
                ':typename': obj({
                  S: str(type),
                }),
              }),
            }),
            scanIndexForward: ifElse(
              ref('context.args.sortDirection'),
              ifElse(equals(ref('context.args.sortDirection'), str('ASC')), bool(true), bool(false)),
              bool(true),
            ),
            filter: ifElse(ref('context.args.filter'), ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), nul()),
            limit: ref('limit'),
            nextToken: ifElse(ref('context.args.nextToken'), ref('util.toJson($context.args.nextToken)'), nul()),
          }),
        ]),
      ),
      ResponseMappingTemplate: print(
        DynamoDBMappingTemplate.dynamoDBResponse(
          isSyncEnabled,
          compoundExpression([iff(raw('!$result'), set(ref('result'), ref('ctx.result'))), raw('$util.toJson($result)')]),
        ),
      ),
    });
  }

  /**
   * Create a resolver that lists items in DynamoDB.
   * TODO: actually fill out the right filter expression. This is a placeholder only.
   * @param type
   */
  public makeListResolver(
    type: string,
    improvePluralization: boolean,
    nameOverride?: string,
    isSyncEnabled: boolean = false,
    queryTypeName: string = 'Query',
  ) {
    const fieldName = nameOverride ? nameOverride : graphqlName('list' + plurality(toUpper(type), improvePluralization));
    const requestVariable = 'ListRequest';
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: queryTypeName,
      RequestMappingTemplate: print(
        compoundExpression([
          set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${ResourceConstants.DEFAULT_PAGE_LIMIT})`)),
          set(
            ref(requestVariable),
            obj({
              version: str(RESOLVER_VERSION_ID),
              limit: ref('limit'),
            }),
          ),
          iff(ref('context.args.nextToken'), set(ref(`${requestVariable}.nextToken`), ref('context.args.nextToken'))),
          iff(
            ref('context.args.filter'),
            set(ref(`${requestVariable}.filter`), ref('util.parseJson("$util.transform.toDynamoDBFilterExpression($ctx.args.filter)")')),
          ),
          ifElse(
            raw(`!$util.isNull($${ResourceConstants.SNIPPETS.ModelQueryExpression})
                        && !$util.isNullOrEmpty($${ResourceConstants.SNIPPETS.ModelQueryExpression}.expression)`),
            compoundExpression([
              qref(`$${requestVariable}.put("operation", "Query")`),
              qref(`$${requestVariable}.put("query", $${ResourceConstants.SNIPPETS.ModelQueryExpression})`),
              ifElse(
                raw(`!$util.isNull($ctx.args.sortDirection) && $ctx.args.sortDirection == "DESC"`),
                set(ref(`${requestVariable}.scanIndexForward`), bool(false)),
                set(ref(`${requestVariable}.scanIndexForward`), bool(true)),
              ),
            ]),
            qref(`$${requestVariable}.put("operation", "Scan")`),
          ),
          raw(`$util.toJson($${requestVariable})`),
        ]),
      ),
      ResponseMappingTemplate: print(DynamoDBMappingTemplate.dynamoDBResponse(isSyncEnabled)),
    });
  }

  /**
   * Create a resolver that deletes an item from DynamoDB.
   * @param type The name of the type to delete an item of.
   * @param nameOverride A user provided override for the field name.
   */
  public makeDeleteResolver({ type, nameOverride, syncConfig, mutationTypeName = 'Mutation' }: MutationResolverInput) {
    const fieldName = nameOverride ? nameOverride : graphqlName('delete' + toUpper(type));
    const isSyncEnabled = syncConfig ? true : false;
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: mutationTypeName,
      RequestMappingTemplate: print(
        compoundExpression([
          ifElse(
            ref(ResourceConstants.SNIPPETS.AuthCondition),
            compoundExpression([
              set(ref('condition'), ref(ResourceConstants.SNIPPETS.AuthCondition)),
              ifElse(
                ref(ResourceConstants.SNIPPETS.ModelObjectKey),
                forEach(ref('entry'), ref(`${ResourceConstants.SNIPPETS.ModelObjectKey}.entrySet()`), [
                  qref('$condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)")'),
                  qref('$condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key")'),
                ]),
                compoundExpression([
                  qref('$condition.put("expression", "$condition.expression AND attribute_exists(#id)")'),
                  qref('$condition.expressionNames.put("#id", "id")'),
                ]),
              ),
            ]),
            this.addDefaultConditionExpression('delete'),
          ),
          iff(
            ref(ResourceConstants.SNIPPETS.VersionedCondition),
            compoundExpression([
              // tslint:disable-next-line
              qref(
                `$condition.put("expression", "($condition.expression) AND $${ResourceConstants.SNIPPETS.VersionedCondition}.expression")`,
              ),
              qref(`$condition.expressionNames.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionNames)`),
              set(ref('expressionValues'), raw('$util.defaultIfNull($condition.expressionValues, {})')),
              qref(`$expressionValues.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionValues)`),
              set(ref('condition.expressionValues'), ref('expressionValues')),
            ]),
          ),
          iff(
            ref('context.args.condition'),
            compoundExpression([
              set(
                ref('conditionFilterExpressions'),
                raw('$util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition))'),
              ),
              // tslint:disable-next-line
              qref(`$condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression")`),
              qref(`$condition.expressionNames.putAll($conditionFilterExpressions.expressionNames)`),
              set(ref('conditionExpressionValues'), raw('$util.defaultIfNull($condition.expressionValues, {})')),
              qref(`$conditionExpressionValues.putAll($conditionFilterExpressions.expressionValues)`),
              set(ref('condition.expressionValues'), ref('conditionExpressionValues')),
              qref(`$condition.expressionValues.putAll($conditionFilterExpressions.expressionValues)`),
            ]),
          ),
          iff(
            and([ref('condition.expressionValues'), raw('$condition.expressionValues.size() == 0')]),
            set(
              ref('condition'),
              obj({
                expression: ref('condition.expression'),
                expressionNames: ref('condition.expressionNames'),
              }),
            ),
          ),
          DynamoDBMappingTemplate.deleteItem({
            key: ifElse(
              ref(ResourceConstants.SNIPPETS.ModelObjectKey),
              raw(`$util.toJson(\$${ResourceConstants.SNIPPETS.ModelObjectKey})`),
              obj({
                id: ref('util.dynamodb.toDynamoDBJson($ctx.args.input.id)'),
              }),
              true,
            ),
            condition: ref('util.toJson($condition)'),
            isSyncEnabled,
          }),
        ]),
      ),
      ResponseMappingTemplate: print(DynamoDBMappingTemplate.dynamoDBResponse(isSyncEnabled)),
      ...(syncConfig && { SyncConfig: SyncUtils.syncResolverConfig(syncConfig) }),
    });
  }

  /**
   * Adds the default Condition Expression uses ModelObjectkey if @key is used
   * @returns
   */

  private addDefaultConditionExpression = (operation: string): Expression => {
    const attributeCheck = operation === 'create' ? 'attribute_not_exists' : 'attribute_exists';
    return ifElse(
      ref(ResourceConstants.SNIPPETS.ModelObjectKey),
      compoundExpression([
        set(
          ref('condition'),
          obj({
            expression: str(''),
            expressionNames: obj({}),
            expressionValues: obj({}),
          }),
        ),
        forEach(ref('entry'), ref(`${ResourceConstants.SNIPPETS.ModelObjectKey}.entrySet()`), [
          ifElse(
            raw('$velocityCount == 1'),
            qref(`$condition.put("expression", "${attributeCheck}(#keyCondition$velocityCount)")`),
            qref('$condition.put(' + `"expression", "$condition.expression AND ${attributeCheck}(#keyCondition$velocityCount)")`),
          ),
          qref('$condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key")'),
        ]),
      ]),
      set(
        ref('condition'),
        obj({
          expression: str(`${attributeCheck}(#id)`),
          expressionNames: obj({
            '#id': str('id'),
          }),
          expressionValues: obj({}),
        }),
      ),
    );
  };
}
