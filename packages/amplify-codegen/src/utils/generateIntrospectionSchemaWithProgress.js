const Ora = require('ora');

const downloadIntrospectionSchema = require('./downloadIntrospectionSchema');
const constants = require('../constants');

async function downloadSchemaWithProgressSpinner(context, apiId, downloadLocation, region) {
  if (!downloadLocation.endsWith('.graphql')) {
    const downloadSpinner = new Ora(constants.INFO_MESSAGE_DOWNLOADING_SCHEMA);
    downloadSpinner.start();
    try {
      const schemaLocation = await downloadIntrospectionSchema(
        context,
        apiId,
        downloadLocation,
        region,
      );
      downloadSpinner.succeed(constants.INFO_MESSAGE_DOWNLOAD_SUCCESS);
      return schemaLocation;
    } catch (e) {
      downloadSpinner.fail(constants.INFO_MESSAGE_DOWNLOAD_ERROR);
      throw e;
    }
  }
  return downloadLocation;
}

module.exports = downloadSchemaWithProgressSpinner;
