import * as AWS from 'aws-sdk';

AWS.config.update({ region: 'us-west-2' });
const CognitoIdentityServiceProvider = AWS.CognitoIdentityServiceProvider;

const getUserPool = async (userpoolId) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider().describeUserPool({UserPoolId: userpoolId}).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
}

const getUserPoolClients = async (userpoolId) => {
  const provider = new CognitoIdentityServiceProvider();
  let res = [];
  try {
    let clients = await provider.listUserPoolClients({UserPoolId: userpoolId}).promise();
    for (let i = 0; i < clients.UserPoolClients.length; i++) {
      let clientData = await provider.describeUserPoolClient({
        UserPoolId: userpoolId,
        ClientId: clients.UserPoolClients[i].ClientId
      }).promise();
      res.push(clientData);
    }
  } catch (e) {
    console.log(e);
  }
  return res;
}

export { getUserPool, getUserPoolClients }