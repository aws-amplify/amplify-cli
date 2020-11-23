const awsRegions = require('./aws-regions');
const Lambda = require('./aws-utils/aws-lambda');
const DynamoDB = require('./aws-utils/aws-dynamodb');
const AppSync = require('./aws-utils/aws-appsync');
const { Lex } = require('./aws-utils/aws-lex');
const Polly = require('./aws-utils/aws-polly');
const SageMaker = require('./aws-utils/aws-sagemaker');
const { transformGraphQLSchema, getDirectiveDefinitions } = require('./transform-graphql-schema');
const { updateStackForAPIMigration } = require('./push-resources');
const SecretsManager = require('./aws-utils/aws-secretsmanager');
const Route53 = require('./aws-utils/aws-route53');
const { run: archiver } = require('./utils/archiver');
const ECR = require('./aws-utils/aws-ecr');
const { pagedAWSCall } = require('./aws-utils/paged-call');

module.exports = {
  zipFiles: (context, [srcDir, dstZipFilePath]) => {
    return archiver(srcDir, dstZipFilePath)
  },
  isDomainInZones: async (context, { domain }) => {

    const client = await new Route53(context);

    let Marker;
    let truncated = false;
    let zoneFound;

    do {
      const { NextMarker, IsTruncated, HostedZones } = await client.route53.listHostedZones({
        Marker,
        MaxItems: '100'
      }).promise();

      zoneFound = HostedZones.find(zone => `${domain}.`.endsWith(zone.Name));

      Marker = NextMarker;
      truncated = IsTruncated;

    } while (truncated && !zoneFound)

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
      context.print.error('Failed to fetch Lambda functions');
      throw err;
    }
    return lambdafunctions;
  },
  getPollyVoices: async context => {
    const pollyModel = await new Polly(context);
    let listOfVoices = [];
    try {
      listOfVoices = await pollyModel.polly.describeVoices().promise();
    } catch (err) {
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
        const paginatedTables = await dynamodbModel.dynamodb.listTables({ Limit: 100, ExclusiveStartTableName: nextToken }).promise();
        const dynamodbTables = paginatedTables.TableNames;
        nextToken = paginatedTables.LastEvaluatedTableName;
        for (let i = 0; i < dynamodbTables.length; i += 1) {
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
      context.print.error('Failed to fetch DynamoDB tables');
      throw err;
    }
  },
  getAppSyncAPIs: context =>
    new AppSync(context)
      .then(result => {
        const appSyncModel = result;
        context.print.debug(result);
        return appSyncModel.appSync.listGraphqlApis({ maxResults: 25 }).promise();
      })
      .then(result => result.graphqlApis),
  getIntrospectionSchema: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    return new AppSync(context, awsOptions)
      .then(result => {
        const appSyncModel = result;
        return appSyncModel.appSync.getIntrospectionSchema({ apiId: options.apiId, format: 'JSON' }).promise();
      })
      .then(result => result.schema.toString() || null);
  },
  getGraphQLApiDetails: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    return new AppSync(context, awsOptions).then(result => {
      const appSyncModel = result;
      return appSyncModel.appSync.getGraphqlApi({ apiId: options.apiId }).promise();
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
    return new Lex(context).then(result => result.lex.getBuiltinSlotTypes(params).promise());
  },
  getSlotTypes: context => {
    const params = {
      maxResults: 50,
    };
    return new Lex(context).then(result => result.lex.getSlotTypes(params).promise());
  },
  getAppSyncApiKeys: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    return new AppSync(context, awsOptions).then(result => {
      const appSyncModel = result;
      return appSyncModel.appSync.listApiKeys({ apiId: options.apiId }).promise();
    });
  },
  getEndpoints: async context => {
    const sagemakerModel = await new SageMaker(context);
    let listOfEndpoints;
    try {
      listOfEndpoints = await sagemakerModel.sageMaker.listEndpoints().promise();
    } catch (err) {
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
