const { join } = require('path');
const globParent = require('glob-parent');

function getGraphQLDocPath(frontend, graphQLDirectory, includePathGlob) {
  if (frontend === 'android') {
    return join(graphQLDirectory, 'com/amazonaws/amplify/generated/graphql');
  }
  //TODO
  return includePathGlob ? globParent(includePathGlob) : graphQLDirectory;
}

module.exports = getGraphQLDocPath;
