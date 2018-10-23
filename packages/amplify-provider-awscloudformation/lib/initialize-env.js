const extract = require('extract-zip');
const fs = require('fs-extra');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');

function run(context, providerMetadata) {
  if (context.exeInfo && context.exeInfo.isNewEnv) {
    return context;
  }

  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = `${backendDir}/.temp`;
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  return new S3(context)
    .then((s3) => {
      const s3Params = {
        Key: zipFilename,
      };
      return s3.getFile(s3Params);
    })
    .then((data) => {
      const backendDir = context.amplify.pathManager.getBackendDirPath();
      const tempDir = `${backendDir}/.temp`;
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
            fs.removeSync(tempDir);
            resolve();
          });
        });
      });
    })
    .then(() => new Cloudformation(context))
    .then(cfnItem => cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName));
  // .then(() => resourcePusher.run(context));
}

module.exports = {
  run,
};
