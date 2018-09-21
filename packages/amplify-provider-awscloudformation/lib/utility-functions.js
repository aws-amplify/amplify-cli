const awsRegions = require('./aws-regions');
const Cognito = require('../src/aws-utils/aws-cognito');
const Lambda = require('../src/aws-utils/aws-lambda');
const DynamoDB = require('../src/aws-utils/aws-dynamodb');
const AppSync = require('../src/aws-utils/aws-appsync');
const { transformGraphQLSchema } = require('./transform-graphql-schema');

module.exports = {
  compileSchema: (context, options) => transformGraphQLSchema(context, options),
  getRegions: () => awsRegions.regions,
  getRegionMappings: () => awsRegions.regionMappings,
  /*eslint-disable*/
  staticRoles: context => ({
    unAuthRoleName: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation
      .UnauthRoleName,
    authRoleName: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation
      .AuthRoleName,
    unAuthRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation
      .UnauthRoleArn,
    authRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation
      .AuthRoleArn,
  }),
  /* eslint-enable */
  getUserPools: (context, options) =>
    new Cognito(context)
      .then(cognitoModel =>
        cognitoModel.cognito
          .listUserPools({ MaxResults: 60 })
          .promise()
          .then((result) => {
            let userPools = result.UserPools;
            if (options && options.region) {
              userPools = userPools.filter(userPool => userPool.Id.startsWith(options.region));
            }
            return userPools;
          }))
      .catch((err) => {
        context.print.error('Failed to fetch user pools');
        throw err;
      }),
  getLambdaFunctions: async (context) => {
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
  getDynamoDBTables: async (context) => {
    const dynamodbModel = await new DynamoDB(context);

    let nextToken;
    const describeTablePromises = [];

    try {
      do {
        const paginatedTables = await dynamodbModel.dynamodb
          .listTables({ Limit: 100, ExclusiveStartTableName: nextToken })
          .promise();
        const dynamodbTables = paginatedTables.TableNames;
        nextToken = paginatedTables.LastEvaluatedTableName;
        for (let i = 0; i < dynamodbTables.length; i += 1) {
          describeTablePromises.push(dynamodbModel.dynamodb
            .describeTable({
              TableName: dynamodbTables[i],
            })
            .promise());
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
      .then((result) => {
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
    return new AppSync(context, { region: options.region })
      .then((result) => {
        const appSyncModel = result;
        return appSyncModel.appSync
          .getIntrospectionSchema({ apiId: options.apiId, format: 'JSON' })
          .promise();
      })
      .then(result => result.schema.toString() || null);
  },
  getGraphQLApiDetails: (context, options) => {
    const awsOptions = {};
    if (options.region) {
      awsOptions.region = options.region;
    }
    return new AppSync(context, awsOptions).then((result) => {
      const appSyncModel = result;
      return appSyncModel.appSync.getGraphqlApi({ apiId: options.apiId }).promise();
    });
  },
};
