const { ApiCategoryFacade, AmplifyFault } = require('@aws-amplify/amplify-cli-core');
const awsRegions = require('./aws-regions');
const { Lambda } = require('./aws-utils/aws-lambda');
const DynamoDB = require('./aws-utils/aws-dynamodb');
const AppSync = require('./aws-utils/aws-appsync');
const { Lex } = require('./aws-utils/aws-lex');
const Polly = require('./aws-utils/aws-polly');
const SageMaker = require('./aws-utils/aws-sagemaker');
const { transformResourceWithOverrides } = require('./override-manager');
const { updateStackForAPIMigration } = require('./push-resources');
const SecretsManager = require('./aws-utils/aws-secretsmanager');
const Route53 = require('./aws-utils/aws-route53');
const { run: archiver } = require('./utils/archiver');
const ECR = require('./aws-utils/aws-ecr');
const { pagedAWSCall } = require('./aws-utils/paged-call');
const { fileLogger } = require('./utils/aws-logger');
const {
  GetGraphqlApiCommand,
  GetIntrospectionSchemaCommand,
  ListApiKeysCommand,
  ListGraphqlApisCommand,
} = require('@aws-sdk/client-appsync');
const { ListHostedZonesCommand } = require('@aws-sdk/client-route-53');
const {
  CreateSecretCommand,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretCommand,
} = require('@aws-sdk/client-secrets-manager');
const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { DescribeVoicesCommand } = require('@aws-sdk/client-polly');
const { DescribeTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { GetBuiltinSlotTypesCommand, GetSlotTypesCommand } = require('@aws-sdk/client-lex-model-building-service');
const { ListEndpointsCommand } = require('@aws-sdk/client-sagemaker');
const { DescribeRepositoriesCommand } = require('@aws-sdk/client-ecr');

const logger = fileLogger('utility-functions');
const { getAccountId } = require('./amplify-sts');
const { getAwsConfig } = require('./configuration-manager');

module.exports = {
  /**
   *
   */
  zipFiles: (context, [srcDir, dstZipFilePath]) => archiver(srcDir, dstZipFilePath),
  /**
   *
   */
  isDomainInZones: async (context, { domain }) => {
    const client = await new Route53(context);

    let Marker;
    let truncated = false;
    let zoneFound;

    do {
      const { NextMarker, IsTruncated, HostedZones } = await client.route53.send(
        new ListHostedZonesCommand({
          Marker,
          MaxItems: '100',
        }),
      );

      zoneFound = HostedZones.find((zone) => `${domain}.`.endsWith(zone.Name));

      Marker = NextMarker;
      truncated = IsTruncated;
    } while (truncated && !zoneFound);

    return zoneFound;
  },
  /**
   *
   */
  compileSchema: async (context, options) => {
    const category = 'api';
    let optionsWithUpdateHandler = { ...options };

    if (!options.dryRun) {
      const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(category);
      let resources = resourcesToBeCreated.concat(resourcesToBeUpdated).concat(allResources);
      resources = resources.filter((resource) => resource.service === 'AppSync');
      resources = resources.map((resource) => resource.resourceName);
      optionsWithUpdateHandler = {
        ...options,
        handleMigration: resources.length ? (opts) => updateStackForAPIMigration(context, category, resources[0], opts) : undefined,
      };
    }

    return ApiCategoryFacade.transformGraphQLSchema(context, optionsWithUpdateHandler);
  },

  /**
   * Utility function to build resource CFN with overrides
   * Resources to build are passed with options
   */
  buildOverrides: async (context, options) => {
    for (const resource of options.resourcesToBuild) {
      await transformResourceWithOverrides(context, resource);
    }
    await transformResourceWithOverrides(context);
  },

  /**
   *
   */
  newSecret: async (context, options) => {
    const { description, secret, name, version } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager.send(
      new CreateSecretCommand({
        Description: description,
        Name: name,
        SecretString: secret,
        ClientRequestToken: version,
      }),
    );

    return response;
  },
  /**
   *
   */
  updateSecret: async (context, options) => {
    const { description, secret, name, version } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager.send(
      new UpdateSecretCommand({
        SecretId: name,
        Description: description,
        SecretString: secret,
        ClientRequestToken: version,
      }),
    );

    return response;
  },
  /**
   *
   */
  upsertSecretValue: async (context, options) => {
    const { name } = options;
    const client = await new SecretsManager(context);

    /** @type {string} */
    let secretArn;

    try {
      ({ ARN: secretArn } = await client.secretsManager.send(new DescribeSecretCommand({ SecretId: name })));
    } catch (error) {
      const { name } = error;

      if (name !== 'ResourceNotFoundException') {
        console.log(error);
        throw new AmplifyFault(
          'ResourceNotFoundFault',
          {
            message: error.message,
          },
          error,
        );
      }
    }

    if (secretArn === undefined) {
      return await module.exports.newSecret(context, options);
    }
    return await module.exports.putSecretValue(context, options);
  },
  /**
   *
   */
  putSecretValue: async (context, options) => {
    const { name, secret } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager.send(
      new PutSecretValueCommand({
        SecretId: name,
        SecretString: secret,
      }),
    );

    return response;
  },
  /**
   * @param {any} context
   * @param {{secretArn: string}} options
   */
  retrieveSecret: async (context, options) => {
    const { secretArn: SecretId } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager.send(
      new GetSecretValueCommand({
        SecretId,
      }),
    );

    return response;
  },
  getAccountId,
  /**
   *
   */
  getTransformerDirectives: async (context, options) => {
    const { resourceDir } = options;
    if (!resourceDir) {
      throw new AmplifyFault('ResourceNotFoundFault', {
        message: 'Missing resource directory.',
      });
    }
    return ApiCategoryFacade.getDirectiveDefinitions(context, resourceDir);
  },
  /**
   *
   */
  getRegions: () => awsRegions.regions,
  /**
   *
   */
  getRegionMappings: () => awsRegions.regionMappings,
  /*eslint-disable*/
  staticRoles: (context) => ({
    unAuthRoleName: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.UnauthRoleName,
    authRoleName: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.AuthRoleName,
    unAuthRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.UnauthRoleArn,
    authRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.AuthRoleArn,
  }),
  /* eslint-enable */
  /**
   *
   */
  getLambdaFunctions: async (context) => {
    const lambdaModel = await new Lambda(context);
    let nextMarker;
    const lambdaFunctions = [];

    do {
      logger('getLambdaFunction.lambdaModel.lambda.listFunctions', {
        MaxItems: 10000,
        Marker: nextMarker,
      })();
      const paginatedFunctions = await lambdaModel.lambda.send(
        new ListFunctionsCommand({
          MaxItems: 10000,
          Marker: nextMarker,
        }),
      );
      if (paginatedFunctions && paginatedFunctions.Functions) {
        lambdaFunctions.push(...paginatedFunctions.Functions);
      }
      nextMarker = paginatedFunctions.NextMarker;
    } while (nextMarker);
    return lambdaFunctions;
  },
  /**
   *
   */
  getPollyVoices: async (context) => {
    const pollyModel = await new Polly(context);
    logger('getPollyVoices.pollyModel.polly.describeVoices', [])();
    return pollyModel.polly.send(new DescribeVoicesCommand());
  },
  /**
   *
   */
  getDynamoDBTables: async (context) => {
    const dynamodbModel = await new DynamoDB(context);

    let nextToken;
    const describeTablePromises = [];

    do {
      logger('getDynamoDBTables.dynamodb.listTables', [
        {
          Limit: 100,
          ExclusiveStartTableName: nextToken,
        },
      ])();
      const paginatedTables = await dynamodbModel.dynamodb.send(new ListTablesCommand({ Limit: 100, ExclusiveStartTableName: nextToken }));
      const dynamodbTables = paginatedTables.TableNames;
      nextToken = paginatedTables.LastEvaluatedTableName;
      for (let i = 0; i < dynamodbTables.length; i += 1) {
        logger('getDynamoDBTables.dynamodb.describeTables', [
          {
            TableName: dynamodbTables[i],
          },
        ])();
        describeTablePromises.push(
          dynamodbModel.dynamodb.send(
            new DescribeTableCommand({
              TableName: dynamodbTables[i],
            }),
          ),
        );
      }
    } while (nextToken);

    const allTables = await Promise.all(describeTablePromises);

    const tablesToReturn = [];
    for (let i = 0; i < allTables.length; i += 1) {
      const arn = allTables[i].Table.TableArn;
      const arnSplit = arn.split(':');
      const region = arnSplit[3];

      tablesToReturn.push({
        Name: allTables[i].Table.TableName,
        Arn: allTables[i].Table.TableArn,
        Region: region,
        KeySchema: allTables[i].Table.KeySchema,
        AttributeDefinitions: allTables[i].Table.AttributeDefinitions,
      });
    }
    return tablesToReturn;
  },
  /**
   * @deprecated Use getGraphQLAPIs instead
   */
  getAppSyncAPIs: (context) => module.exports.getGraphQLAPIs(context),
  /**
   *
   */
  getGraphQLAPIs: (context) => {
    logger('getGraphQLAPIs.appSyncModel.appSync.listGraphqlApis', { maxResults: 25 })();

    return new AppSync(context)
      .then((result) => {
        const appSyncModel = result;
        return appSyncModel.appSync.send(new ListGraphqlApisCommand({ maxResults: 25 }));
      })
      .then((result) => result.graphqlApis);
  },
  /**
   *
   */
  getIntrospectionSchema: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }

    return new AppSync(context, awsOptions)
      .then((result) => {
        const appSyncModel = result;
        logger('getIntrospectionSchema.appSyncModel.appSync.getIntrospectionSchema', [
          {
            apiId: options.apiId,
            format: 'JSON',
          },
        ])();
        return appSyncModel.appSync.send(GetIntrospectionSchemaCommand({ apiId: options.apiId, format: 'JSON' }));
      })
      .then((result) => result.schema.toString() || null);
  },
  /**
   *
   */
  getGraphQLApiDetails: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    logger('getGraphQLApiDetails.appSyncModel.appSync.getGraphqlApi', [
      {
        apiId: options.apiId,
      },
    ])();
    return new AppSync(context, awsOptions).then((result) => {
      const appSyncModel = result;
      return appSyncModel.appSync.send(new GetGraphqlApiCommand({ apiId: options.apiId }));
    });
  },
  /**
   *
   */
  getBuiltInSlotTypes: (context, options) => {
    const params = {
      locale: 'en-US',
      maxResults: 50,
    };
    if (options) {
      params.nextToken = options;
    }
    logger('getBuiltInSlotTypes.lex.getBuiltinSlotTypes', [params])();
    return new Lex(context).then((result) => {
      logger();
      return result.lex.send(new GetBuiltinSlotTypesCommand(params));
    });
  },
  /**
   *
   */
  getSlotTypes: (context) => {
    const params = {
      maxResults: 50,
    };
    logger('getSlotTypes.lex.getSlotTypes', [params])();
    return new Lex(context).then((result) => result.lex.send(new GetSlotTypesCommand(params)));
  },
  /**
   * @deprecated Use getGraphQLApiKeys instead
   */
  getAppSyncApiKeys: (context, options) => module.exports.getGraphQLApiKeys(context, options),
  /**
   *
   */
  getGraphQLApiKeys: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    logger('getGraphQLApiKeys.appSync.listApiKeys', [
      {
        apiId: options.apiId,
      },
    ])();
    return new AppSync(context, awsOptions).then((result) => result.appSync.send(new ListApiKeysCommand({ apiId: options.apiId })));
  },
  /**
   *
   */
  getEndpoints: async (context) => {
    const sagemakerModel = await new SageMaker(context);
    logger('getEndpoints.sageMaker.listEndpoints', [])();
    return sagemakerModel.sageMaker.send(new ListEndpointsCommand());
  },
  /**
   *
   */
  describeEcrRepositories: async (context, options) => {
    const ecr = await new ECR(context);

    const results = await pagedAWSCall(
      async (params, nextToken) => ecr.ecr.send(new DescribeRepositoriesCommand({ ...params, nextToken })),
      options,
      ({ repositories }) => repositories,
      ({ nextToken }) => nextToken,
    );

    return results;
  },
  /**
   * Provides the same AWS config used to push the amplify project
   */
  retrieveAwsConfig: async (context) => getAwsConfig(context),
};
