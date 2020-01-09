const fs = require('fs-extra');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');
const { downloadZip, extractZip } = require('./zip-util');
const { S3BackendZipFileName } = require('./constants');

function run(context, providerMetadata) {
  if (context.exeInfo && context.exeInfo.isNewEnv) {
    return context;
  }

  const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
  const tempDir = `${amplifyDir}/.temp`;
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  return new S3(context)
    .then(s3 =>
      downloadZip(s3, tempDir, S3BackendZipFileName).then(file =>
        extractZip(tempDir, file).then(unzippeddir => {
          fs.removeSync(currentCloudBackendDir);
          fs.copySync(unzippeddir, currentCloudBackendDir);
          if (context.exeInfo.restoreBackend) {
            fs.removeSync(backendDir);
            fs.copySync(`${tempDir}/#current-cloud-backend`, backendDir);
          }
          fs.removeSync(tempDir);
        })
      )
    )
    .then(() => new Cloudformation(context))
    .then(cfnItem => cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName))
    .then(() => {
      // Copy provider metadata from current-cloud-backend/amplify-meta to backend/ampliy-meta
      const currentAmplifyMetafilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
      const currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetafilePath);

      const amplifyMetafilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
      const amplifyMeta = context.amplify.readJsonFile(amplifyMetafilePath);

      // Copy providerMetadata for each resource - from what is there in the cloud

      Object.keys(amplifyMeta).forEach(category => {
        Object.keys(amplifyMeta[category]).forEach(resource => {
          if (currentAmplifyMeta[category] && currentAmplifyMeta[category][resource]) {
            amplifyMeta[category][resource].providerMetadata = currentAmplifyMeta[category][resource].providerMetadata;
          }
        });
      });

      const jsonString = JSON.stringify(amplifyMeta, null, 4);
      fs.writeFileSync(amplifyMetafilePath, jsonString, 'utf8');
    });
}

module.exports = {
  run,
};
