const getFrontEndHandler = require('./getFrontEndHandler');
const getFrontEndFramework = require('./getFrontEndFramework');
const getAppSyncAPIDetails = require('./getAppSyncAPIDetails');
const getOutputFileName = require('./getOutputFileName');
const downloadIntrospectionSchema = require('./downloadIntrospectionSchema');
const getSchemaDownloadLocation = require('./getSchemaDownloadLocation');
const getIncludePattern = require('./getIncludePattern');
const getAppSyncAPIInfo = require('./getAppSyncAPIInfo');
const getProjectAwsRegion = require('./getProjectAWSRegion');
const getGraphQLDocPath = require('./getGraphQLDocPath');
const downloadIntrospectionSchemaWithProgress = require('./generateIntrospectionSchemaWithProgress');
const isAppSyncApiPendingPush = require('./isAppSyncApiPendingPush');
const updateAmplifyMeta = require('./updateAmplifyMeta');
const isCodegenConfigured = require('./isCodegenConfigured');
const getSDLSchemaLocation = require('./getSDLSchemaLocation');
const switchToSDLSchema = require('./switchToSDLSchema');
const ensureIntrospectionSchema = require('./ensureIntrospectionSchema');

module.exports = {
  getAppSyncAPIDetails,
  getFrontEndHandler,
  getFrontEndFramework,
  getSchemaDownloadLocation,
  getOutputFileName,
  downloadIntrospectionSchema,
  downloadIntrospectionSchemaWithProgress,
  getIncludePattern,
  getAppSyncAPIInfo,
  getProjectAwsRegion,
  getGraphQLDocPath,
  isAppSyncApiPendingPush,
  updateAmplifyMeta,
  isCodegenConfigured,
  getSDLSchemaLocation,
  switchToSDLSchema,
  ensureIntrospectionSchema,
};
