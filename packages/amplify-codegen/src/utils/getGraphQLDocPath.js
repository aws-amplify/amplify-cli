const { join } = require('path');
const globParent = require('glob-parent');

function getGraphQLDocPath(frontend, graphQLDirectory, includePathGlob) {
  if (frontend === 'android') {
    return join(graphQLDirectory, 'com/amazonaws/amplify/generated/graphql');
  }
  return Array.isArray(includePathGlob) && includePathGlob.length > 0
    ? globParent(includePathGlob[0])
    : graphQLDirectory;
}

module.exports = getGraphQLDocPath;
