const extract = require('extract-zip');
const fs = require('fs-extra');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');

function run(context, providerMetadata) {
  if (context.exeInfo && context.exeInfo.isNewEnv) {
    return context;
  }

  const zipFilename = '#current-cloud-backend.zip';
  const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
  const tempDir = `${amplifyDir}/.temp`;
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
  const backendDir = context.amplify.pathManager.getBackendDirPath();

  return new S3(context)
    .then((s3) => {
      const s3Params = {
        Key: zipFilename,
      };
      return s3.getFile(s3Params);
    })
    .then((data) => {
      fs.ensureDirSync(tempDir);
      const buff = Buffer.from(data);

      return new Promise((resolve, reject) => {
        fs.writeFile(`${tempDir}/${zipFilename}`, buff, (err) => {
          if (err) {
            reject(err);
          }
          extract(`${tempDir}/${zipFilename}`, { dir: `${tempDir}/#current-cloud-backend` }, (err) => {
            if (err) {
              reject(err);
            }
            fs.removeSync(currentCloudBackendDir);
            fs.copySync(`${tempDir}/#current-cloud-backend`, currentCloudBackendDir);
            if (context.exeInfo.restoreBackend) {
              fs.removeSync(backendDir);
              fs.copySync(`${tempDir}/#current-cloud-backend`, backendDir);
            }
            fs.removeSync(tempDir);
            resolve();
          });
        });
      });
    })
    .then(() => new Cloudformation(context))
    .then(cfnItem => cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName))
    .then(() => {
      // Copy provider metadata from current-cloud-backend/amplify-meta to backend/ampliy-meta
      const currentAmplifyMetafilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
      const currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetafilePath);

      const amplifyMetafilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
      const amplifyMeta = context.amplify.readJsonFile(amplifyMetafilePath);

      // Copy providerMetadata for each resource - from what is there in the cloud

      Object.keys(amplifyMeta).forEach((category) => {
        Object.keys(amplifyMeta[category]).forEach((resource) => {
          if (currentAmplifyMeta[category] && currentAmplifyMeta[category][resource]) {
            amplifyMeta[category][resource].providerMetadata =
            currentAmplifyMeta[category][resource].providerMetadata;
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
