const getFrontEndHandler = require('./getFrontEndHandler');
const getAppSyncAPIDetails = require('./getAppSyncAPIDetails');
const getOutputFileName = require('./getOutputFileName');
const downloadIntrospectionSchema = require('./downloadIntrospectionSchema');
const getSchemaDownloadLocation = require('./getSchemaDownloadLocation');
const getIncludePattern = require('./getIncludePattern');
const getAppSyncAPIInfo = require('./getAppSyncAPIInfo');
const getGraphQLDocPath = require('./getGraphQLDocPath');

module.exports = {
  getAppSyncAPIDetails,
  getFrontEndHandler,
  getSchemaDownloadLocation,
  getOutputFileName,
  downloadIntrospectionSchema,
  getIncludePattern,
  getAppSyncAPIInfo,
  getGraphQLDocPath,
};
