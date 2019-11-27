import { config, DynamoDB, S3, CognitoIdentityServiceProvider, Lambda, LexModelBuildingService, Rekognition, AppSync } from 'aws-sdk';

const getDDBTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region });
  return await service.describeTable({ TableName: tableName }).promise();
};

const checkIfBucketExists = async (bucketName: string, region: string) => {
  const service = new S3({ region });
  return await service.headBucket({ Bucket: bucketName }).promise();
};

const getUserPool = async (userpoolId, region) => {
  config.update({ region });
  let res;
  try {
    res = await new CognitoIdentityServiceProvider().describeUserPool({ UserPoolId: userpoolId }).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

const getLambdaFunction = async (functionName, region) => {
  config.update({ region });
  const lambda = new Lambda();
  let res;
  try {
    res = await lambda.getFunction({ FunctionName: functionName }).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

const getUserPoolClients = async (userpoolId, region) => {
  config.update({ region });
  const provider = new CognitoIdentityServiceProvider();
  const res = [];
  try {
    const clients = await provider.listUserPoolClients({ UserPoolId: userpoolId }).promise();
    for (let i = 0; i < clients.UserPoolClients.length; i++) {
      const clientData = await provider
        .describeUserPoolClient({
          UserPoolId: userpoolId,
          ClientId: clients.UserPoolClients[i].ClientId,
        })
        .promise();
      res.push(clientData);
    }
  } catch (e) {
    console.log(e);
  }
  return res;
};

const getBot = async (botName: string, region: string) => {
  const service = new LexModelBuildingService({ region });
  return await service.getBot({ name: botName, versionOrAlias: '$LATEST' }).promise();
};

const getFunction = async (functionName: string, region: string) => {
  const service = new Lambda({ region });
  return await service.getFunction({ FunctionName: functionName }).promise();
};

const getCollection = async (collectionId: string, region: string) => {
  const service = new Rekognition({ region });
  return await service.describeCollection({ CollectionId: collectionId }).promise();
};

const getTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region });
  return await service.describeTable({ TableName: tableName }).promise();
};

const deleteTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region });
  return await service.deleteTable({ TableName: tableName }).promise();
};

const getAppSyncApi = async (appSyncApiId: string, region: string) => {
  const service = new AppSync({ region });
  return await service.getGraphqlApi({ apiId: appSyncApiId }).promise();
};

export {
  getDDBTable,
  checkIfBucketExists,
  getUserPool,
  getUserPoolClients,
  getBot,
  getLambdaFunction,
  getFunction,
  getTable,
  deleteTable,
  getAppSyncApi,
  getCollection,
};
