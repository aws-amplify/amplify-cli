const getGraphQLDocPath = require('../../src/utils/getGraphQLDocPath');

describe('getGraphQLDocPath', () => {
  it('should return com/amplify/generated/graphql when used in android project', () => {
    const SCHEMA_LOCATION = 'app/src/main/graphql/scheam.json';
    expect(getGraphQLDocPath('android', SCHEMA_LOCATION)).toEqual('app/src/main/graphql/com/amazonaws/amplify/generated/graphql');
  });

  it('should return graphql folder when frontend is not android', () => {
    const SCHEMA_LOCATION = 'src/scheam.json';
    expect(getGraphQLDocPath('ios', SCHEMA_LOCATION)).toEqual('src');
  });
});
