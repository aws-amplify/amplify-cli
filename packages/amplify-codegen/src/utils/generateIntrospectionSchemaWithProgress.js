const Ora = require('ora');

const downloadIntrospectionSchema = require('./downloadIntrospectionSchema');
const constants = require('../constants');

async function downloadSchemaWithProgressSpinner(context, apiId, downloadLocation, region) {
  const downloadSpinner = new Ora(constants.INFO_MESSAGE_DOWNLOADING_SCHEMA);
  downloadSpinner.start();
  const schemaLocation = await downloadIntrospectionSchema(
    context,
    apiId,
    downloadLocation,
    region,
  );
  downloadSpinner.succeed(constants.INFO_MESSAGE_DOWNLOAD_SUCCESS);
  return schemaLocation;
}

module.exports = downloadSchemaWithProgressSpinner;
