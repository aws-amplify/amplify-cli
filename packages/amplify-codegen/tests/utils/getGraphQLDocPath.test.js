const getGraphQLDocPath = require('../../src/utils/getGraphQLDocPath');
const getIncludePatterns = require('../../src/utils/getIncludePattern')

describe('getGraphQLDocPath', () => {
  it('should return com/amplify/generated/graphql when used in android project', () => {
    const SCHEMA_LOCATION = 'app/src/main/graphql/schema.json';
    const graphQLDirectory = getIncludePatterns('android', SCHEMA_LOCATION).graphQLDirectory;
    expect(getGraphQLDocPath('android', graphQLDirectory)).toEqual('app/src/main/graphql/com/amazonaws/amplify/generated/graphql');
  });

  it('should return default folder when frontend is not android and include path not defined', () => {
    const graphQLDirectory = getIncludePatterns('javascript').graphQLDirectory;
    expect(getGraphQLDocPath('javascript', graphQLDirectory)).toEqual('src/graphql');
  });

  it('should return parent folder for include glob path when frontend is not android and include path is defined', () => {
    const graphQLDirectory = getIncludePatterns('javascript').graphQLDirectory;
    const includePathGlob = 'path/to/graphql/**/*.js';
    expect(getGraphQLDocPath('javascript', graphQLDirectory, includePathGlob)).toEqual('path/to/graphql');
  });
});
