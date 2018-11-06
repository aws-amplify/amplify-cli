const { join, dirname } = require('path');

function getIncludePatterns(language, schemaLocation) {
  let graphQLDirectory;
  let graphQLExtension;
  switch (language) {
    case 'android':
      graphQLDirectory = dirname(schemaLocation);
      graphQLExtension = '*.graphql';
      break;
    case 'typescript':
      graphQLDirectory = join('src', 'graphql');
      graphQLExtension = '*.ts';
      break;
    case 'javascript':
    case 'flow':
      graphQLDirectory = join('src', 'graphql');
      graphQLExtension = '*.js';
      break;
    case 'angular':
      graphQLDirectory = join('src', 'graphql');
      graphQLExtension = '*.graphql';
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
