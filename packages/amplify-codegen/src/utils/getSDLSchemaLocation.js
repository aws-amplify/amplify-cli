const path = require('path');

function getSDLSchemaLocation(apiName) {
  return path.join('amplify', 'backend', 'api', apiName, 'build', 'schema.graphql');
}

module.exports = getSDLSchemaLocation;
