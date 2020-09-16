const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { PathConstants, stateManager } = require('amplify-cli-core');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');
const { downloadZip, extractZip } = require('./zip-util');
const { S3BackendZipFileName } = require('./constants');

function run(context, providerMetadata) {
  if (context.exeInfo && context.exeInfo.isNewEnv) {
    return context;
  }

  const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
  const tempDir = path.join(amplifyDir, '.temp');
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
  const backendDir = context.amplify.pathManager.getBackendDirPath();

  return new S3(context)
    .then(s3 =>
      downloadZip(s3, tempDir, S3BackendZipFileName).then(file =>
        extractZip(tempDir, file).then(unzippeddir => {
          fs.removeSync(currentCloudBackendDir);

          // Move out cli.*json if exists in the temp directory into the amplify directory before copying backand and
          // current cloud backend directories.
          const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
            cwd: unzippeddir,
            absolute: true,
          });

          if (context.exeInfo.restoreBackend) {
            // If backend must be restored then copy out the config files and overwrite existing ones.
            for (const cliJSONFilePath of cliJSONFiles) {
              const targetPath = path.join(amplifyDir, path.basename(cliJSONFilePath));

              fs.moveSync(cliJSONFilePath, targetPath, { overwrite: true });
            }
          } else {
            // If backend is not being restored, just delete the config files in the current cloud backend if present
            for (const cliJSONFilePath of cliJSONFiles) {
              fs.removeSync(cliJSONFilePath);
            }
          }

          fs.copySync(unzippeddir, currentCloudBackendDir);

          if (context.exeInfo.restoreBackend) {
            fs.removeSync(backendDir);
            fs.copySync(unzippeddir, backendDir);
          }
          fs.removeSync(tempDir);
        }),
      ),
    )
    .then(() => new Cloudformation(context))
    .then(cfnItem => cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName))
    .then(() => {
      // Copy provider metadata from current-cloud-backend/amplify-meta to backend/ampliy-meta
      const currentAmplifyMeta = stateManager.getCurrentMeta();
      const amplifyMeta = stateManager.getMeta();

      // Copy providerMetadata for each resource - from what is there in the cloud

      Object.keys(amplifyMeta).forEach(category => {
        Object.keys(amplifyMeta[category]).forEach(resource => {
          if (currentAmplifyMeta[category] && currentAmplifyMeta[category][resource]) {
            amplifyMeta[category][resource].providerMetadata = currentAmplifyMeta[category][resource].providerMetadata;
          }
        });
      });

      stateManager.setMeta(undefined, amplifyMeta);
    });
}

module.exports = {
  run,
};
