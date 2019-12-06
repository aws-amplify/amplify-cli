const getAppSyncAPIs = require('../../src/utils/getAppSyncAPIs');

describe('getAppSyncAPIs', () => {
  const apiMeta = {
    appSync1: {
      service: 'AppSync',
      output: {
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AWS_IAM',
          },
        },
        GraphQLApiId: 'rmez4smy7bbqrpanvaaefywt64',
        GraphQLApiEndpoint: 'https://fp772p7p3faoldgp54vxicfyjy.appsync-api.us-east-1.amazonaws.com/graphql',
        Region: 'us-east-1',
      },
    },
    appSync2: {
      service: 'AppSync',
      output: {
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AWS_IAM',
          },
        },
        GraphQLApiId: '2c6gvpbh6jfjhjdazm2d5cixtm',
        GraphQLApiEndpoint: 'https://vq5t7rm63fazjlbn74duugnyle.appsync-api.us-east-1.amazonaws.com/graphql',
        Region: 'us-east-1',
        GraphQLApiARN: 'arn:aws:appsync:us-east-1:744586199449:apis/2c6gvpbh6jfjhjdazm2d5cixtm',
        PostDynamoDBTableDataSourceARN:
          'arn:aws:appsync:us-east-1:744586199449:apis/2c6gvpbh6jfjhjdazm2d5cixtm/datasources/PostDynamoDBTable',
        PostDynamoDBTableDataSourceName: 'PostDynamoDBTable',
      },
    },
    someThingElse: {
      service: 'ApiGW',
      output: {
        securityType: 'AWS_IAM',
        GraphQLApiId: '2c6gvpbh6jfjhjdazm2d5cixtm',
        GraphQLApiEndpoint: 'https://vq5t7rm63fazjlbn74duugnyle.appsync-api.us-east-1.amazonaws.com/graphql',
        Region: 'us-east-1',
        GraphQLApiARN: 'arn:aws:appsync:us-east-1:744586199449:apis/2c6gvpbh6jfjhjdazm2d5cixtm',
        PostDynamoDBTableDataSourceARN:
          'arn:aws:appsync:us-east-1:744586199449:apis/2c6gvpbh6jfjhjdazm2d5cixtm/datasources/PostDynamoDBTable',
        PostDynamoDBTableDataSourceName: 'PostDynamoDBTable',
      },
    },
  };

  it('should return the projects array with name', () => {
    const expectedApiList = [
      { ...apiMeta.appSync1, name: 'appSync1' },
      { ...apiMeta.appSync2, name: 'appSync2' },
    ];
    expect(getAppSyncAPIs(apiMeta)).toEqual(expectedApiList);
  });

  it('should return an empty list when there are no APIs in the meta data', () => {
    expect(getAppSyncAPIs()).toEqual([]);
    expect(getAppSyncAPIs({})).toEqual([]);
    expect(getAppSyncAPIs([])).toEqual([]);
    expect(getAppSyncAPIs({ someRandomAPI: {} })).toEqual([]);
  });
});
