import * as AWS from 'aws-sdk';

const getUserPool = async (userpoolId, region) => {
  AWS.config.update({ region });
  const CognitoIdentityServiceProvider = AWS.CognitoIdentityServiceProvider;
  let res;
  try {
    res = await new CognitoIdentityServiceProvider()
      .describeUserPool({ UserPoolId: userpoolId })
      .promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

const getUserPoolClients = async (userpoolId, region) => {
  AWS.config.update({ region });
  const CognitoIdentityServiceProvider = AWS.CognitoIdentityServiceProvider;
  const provider = new CognitoIdentityServiceProvider();
  let res = [];
  try {
    let clients = await provider.listUserPoolClients({ UserPoolId: userpoolId }).promise();
    for (let i = 0; i < clients.UserPoolClients.length; i++) {
      let clientData = await provider
        .describeUserPoolClient({
          UserPoolId: userpoolId,
          ClientId: clients.UserPoolClients[i].ClientId
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
  const service = new AWS.LexModelBuildingService({ region });
  return await service.getBot({ name: botName, versionOrAlias: '$LATEST' }).promise();
};

const getFunction = async (functionName: string, region: string) => {
  const service = new AWS.Lambda({ region });
  return await service.getFunction({ FunctionName: functionName }).promise();
};

export { getUserPool, getUserPoolClients, getBot, getFunction };
