const awsRegions = require('./aws-regions');
const { Lambda } = require('./aws-utils/aws-lambda');
const DynamoDB = require('./aws-utils/aws-dynamodb');
const AppSync = require('./aws-utils/aws-appsync');
const { Lex } = require('./aws-utils/aws-lex');
const Polly = require('./aws-utils/aws-polly');
const SageMaker = require('./aws-utils/aws-sagemaker');
const { transformGraphQLSchema, getDirectiveDefinitions } = require('./transform-graphql-schema');
const { transformResourceWithOverrides } = require('./override-manager');

const { updateStackForAPIMigration } = require('./push-resources');
const SecretsManager = require('./aws-utils/aws-secretsmanager');
const Route53 = require('./aws-utils/aws-route53');
const { run: archiver } = require('./utils/archiver');
const ECR = require('./aws-utils/aws-ecr');
const { pagedAWSCall } = require('./aws-utils/paged-call');
const { fileLogger } = require('./utils/aws-logger');
const logger = fileLogger('utility-functions');
const { getAccountId } = require('./amplify-sts');

module.exports = {
  zipFiles: (context, [srcDir, dstZipFilePath]) => {
    return archiver(srcDir, dstZipFilePath);
  },
  isDomainInZones: async (context, { domain }) => {
    const client = await new Route53(context);

    let Marker;
    let truncated = false;
    let zoneFound;

    do {
      const { NextMarker, IsTruncated, HostedZones } = await client.route53
        .listHostedZones({
          Marker,
          MaxItems: '100',
        })
        .promise();

      zoneFound = HostedZones.find(zone => `${domain}.`.endsWith(zone.Name));

      Marker = NextMarker;
      truncated = IsTruncated;
    } while (truncated && !zoneFound);

    return zoneFound;
  },
  compileSchema: async (context, options) => {
    const category = 'api';
    let optionsWithUpdateHandler = { ...options };

    if (!options.dryRun) {
      const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(category);
      let resources = resourcesToBeCreated.concat(resourcesToBeUpdated).concat(allResources);
      resources = resources.filter(resource => resource.service === 'AppSync');
      resources = resources.map(resource => resource.resourceName);
      optionsWithUpdateHandler = {
        ...options,
        handleMigration: resources.length ? opts => updateStackForAPIMigration(context, category, resources[0], opts) : undefined,
      };
    }

    return transformGraphQLSchema(context, optionsWithUpdateHandler);
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

  newSecret: async (context, options) => {
    const { description, secret, name, version } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager
      .createSecret({
        Description: description,
        Name: name,
        SecretString: secret,
        ClientRequestToken: version,
      })
      .promise();

    return response;
  },
  updateSecret: async (context, options) => {
    const { description, secret, name, version } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager
      .updateSecret({
        SecretId: name,
        Description: description,
        SecretString: secret,
        ClientRequestToken: version,
      })
      .promise();

    return response;
  },
  upsertSecretValue: async (context, options) => {
    const { name } = options;
    const client = await new SecretsManager(context);

    /** @type {string} */
    let secretArn;

    try {
      ({ ARN: secretArn } = await client.secretsManager.describeSecret({ SecretId: name }).promise());
    } catch (error) {
      const { code } = error;

      if (code !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    if (secretArn === undefined) {
      return await module.exports.newSecret(context, options);
    } else {
      return await module.exports.putSecretValue(context, options);
    }
  },
  putSecretValue: async (context, options) => {
    const { name, secret } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager
      .putSecretValue({
        SecretId: name,
        SecretString: secret,
      })
      .promise();

    return response;
  },
  /**
   * @param {any} context
   * @param {{secretArn: string}} options
   */
  retrieveSecret: async (context, options) => {
    const { secretArn: SecretId } = options;
    const client = await new SecretsManager(context);
    const response = await client.secretsManager
      .getSecretValue({
        SecretId,
      })
      .promise();

    return response;
  },
  getAccountId,
  getTransformerDirectives: async (context, options) => {
    const { resourceDir } = options;
    if (!resourceDir) {
      throw new Error('missing resource directory');
    }
    return getDirectiveDefinitions(context, resourceDir);
  },
  getRegions: () => awsRegions.regions,
  getRegionMappings: () => awsRegions.regionMappings,
  /*eslint-disable*/
  staticRoles: context => ({
    unAuthRoleName: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.UnauthRoleName,
    authRoleName: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.AuthRoleName,
    unAuthRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.UnauthRoleArn,
    authRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation.AuthRoleArn,
  }),
  /* eslint-enable */
  getLambdaFunctions: async context => {
    const lambdaModel = await new Lambda(context);
    let nextMarker;
    const lambdafunctions = [];

    try {
      do {
        logger('getLambdaFunction.lambdaModel.lambda.listFunctions', {
          MaxItems: 10000,
          Marker: nextMarker,
        })();
        const paginatedFunctions = await lambdaModel.lambda
          .listFunctions({
            MaxItems: 10000,
            Marker: nextMarker,
          })
          .promise();
        if (paginatedFunctions && paginatedFunctions.Functions) {
          lambdafunctions.push(...paginatedFunctions.Functions);
        }
        nextMarker = paginatedFunctions.NextMarker;
      } while (nextMarker);
    } catch (err) {
      logger('getLambdaFunction.lambdaModel.lambda.listFunctions', {
        MaxItems: 10000,
        Marker: nextMarker,
      })(err);
      context.print.error('Failed to fetch Lambda functions');
      throw err;
    }
    return lambdafunctions;
  },
  getPollyVoices: async context => {
    const pollyModel = await new Polly(context);
    let listOfVoices = [];
    const log = logger('getPollyVoices.polluModel.polly.describeVoices', []);
    try {
      log();
      listOfVoices = await pollyModel.polly.describeVoices().promise();
    } catch (err) {
      log(err);
      context.print.error('Failed to load voices');
      throw err;
    }
    return listOfVoices;
  },
  getDynamoDBTables: async context => {
    const dynamodbModel = await new DynamoDB(context);

    let nextToken;
    const describeTablePromises = [];

    try {
      do {
        logger('getDynamoDBTables.dynamodb.listTables', [
          {
            Limit: 100,
            ExclusiveStartTableName: nextToken,
          },
        ])();
        const paginatedTables = await dynamodbModel.dynamodb.listTables({ Limit: 100, ExclusiveStartTableName: nextToken }).promise();
        const dynamodbTables = paginatedTables.TableNames;
        nextToken = paginatedTables.LastEvaluatedTableName;
        for (let i = 0; i < dynamodbTables.length; i += 1) {
          logger('getDynamoDBTables.dynamodb.describeTables', [
            {
              TableName: dynamodbTables[i],
            },
          ])();
          describeTablePromises.push(
            dynamodbModel.dynamodb
              .describeTable({
                TableName: dynamodbTables[i],
              })
              .promise(),
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
    } catch (err) {
      logger('getDynamoDBTables.dynamodb.*', [])(err);
      context.print.error('Failed to fetch DynamoDB tables');
      throw err;
    }
  },
  getAppSyncAPIs: context => {
    const log = logger('getAppSyncAPIs.appSyncModel.appSync.listGraphqlApis', { maxResults: 25 });

    return new AppSync(context)
      .then(result => {
        const appSyncModel = result;
        context.print.debug(result);
        log();
        return appSyncModel.appSync.listGraphqlApis({ maxResults: 25 }).promise();
      })
      .then(result => result.graphqlApis)
      .catch(ex => {
        log(ex);
        throw ex;
      });
  },
  getIntrospectionSchema: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    let log = null;

    return new AppSync(context, awsOptions)
      .then(result => {
        const appSyncModel = result;
        log = logger('getIntrospectionSchema.appSyncModel.appSync.getIntrospectionSchema', [
          {
            apiId: options.apiId,
            format: 'JSON',
          },
        ]);
        log();
        return appSyncModel.appSync.getIntrospectionSchema({ apiId: options.apiId, format: 'JSON' }).promise();
      })
      .then(result => result.schema.toString() || null)
      .catch(ex => {
        log(ex);
        throw ex;
      });
  },
  getGraphQLApiDetails: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    const log = logger('getGraphQLApiDetails.appSyncModel.appSync.getGraphqlApi', [
      {
        apiId: options.apiId,
      },
    ]);
    return new AppSync(context, awsOptions)
      .then(result => {
        const appSyncModel = result;
        log();
        return appSyncModel.appSync.getGraphqlApi({ apiId: options.apiId }).promise();
      })
      .catch(ex => {
        log(ex);
        throw ex;
      });
  },
  getBuiltInSlotTypes: (context, options) => {
    const params = {
      locale: 'en-US',
      maxResults: 50,
    };
    if (options) {
      params.nextToken = options;
    }
    const log = logger('getBuiltInSlotTypes.lex.getBuiltinSlotTypes', [params]);
    return new Lex(context)
      .then(result => {
        log();
        return result.lex.getBuiltinSlotTypes(params).promise();
      })
      .catch(ex => {
        log(ex);
        throw ex;
      });
  },
  getSlotTypes: context => {
    const params = {
      maxResults: 50,
    };
    const log = logger('getSlotTypes.lex.getSlotTypes', [params]);
    return new Lex(context)
      .then(result => result.lex.getSlotTypes(params).promise())
      .catch(ex => {
        log(ex);
        throw ex;
      });
  },
  getAppSyncApiKeys: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    const log = logger('getAppSyncApiKeys.appSync.listApiKeys', [
      {
        apiId: options.apiId,
      },
    ]);
    return new AppSync(context, awsOptions)
      .then(result => {
        const appSyncModel = result;
        log();
        return appSyncModel.appSync.listApiKeys({ apiId: options.apiId }).promise();
      })
      .catch(ex => {
        log(ex);
        throw ex;
      });
  },
  getEndpoints: async context => {
    const sagemakerModel = await new SageMaker(context);
    let listOfEndpoints;
    const log = logger('getEndpoints.sageMaker.listEndpoints', []);
    try {
      log();
      listOfEndpoints = await sagemakerModel.sageMaker.listEndpoints().promise();
    } catch (err) {
      log(err);
      context.print.error('Failed to load endpoints');
      throw err;
    }
    return listOfEndpoints;
  },
  describeEcrRepositories: async (context, options) => {
    const ecr = await new ECR(context);

    const results = await pagedAWSCall(
      async (params, nextToken) => ecr.ecr.describeRepositories({ ...params, nextToken }).promise(),
      options,
      ({ repositories }) => repositories,
      ({ nextToken }) => nextToken,
    );

    return results;
  },
};
