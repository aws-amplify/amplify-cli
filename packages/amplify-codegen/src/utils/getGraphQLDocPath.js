const { join, dirname } = require('path');

function getGraphQLDocPath(frontend, schemaLocation) {
  const graphQLDirectory = dirname(schemaLocation);
  let subDirectory;
  switch (frontend) {
    case 'android':
      subDirectory = 'com/amazonaws/amplify/generated/graphql';
      break;
    default:
      subDirectory = '';
  }

  return join(graphQLDirectory, subDirectory);
}

module.exports = getGraphQLDocPath;
