const { join, dirname } = require('path');

function getIncludePatterns(frontendHandler, schemaLocation) {
  let graphQLDirectory;
  let graphQLExtension;
  switch (frontendHandler) {
    case 'android':
      graphQLDirectory = dirname(schemaLocation);
      graphQLExtension = '*.graphql';
      break;
    case 'javascript':
      graphQLDirectory = join('src', 'graphql');
      graphQLExtension = '*.js';
      break;
    default:
      graphQLDirectory = 'graphql';
      graphQLExtension = '*.graphql';
  }

  return {
    graphQLDirectory,
    graphQLExtension,
  };
}

module.exports = getIncludePatterns;
