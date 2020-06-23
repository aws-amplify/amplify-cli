const fs = require('fs-extra');
const path = require('path');

const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');
const { loadConfigurationForEnv } = require('./configuration-manager');
const { deleteEnv } = require('./amplify-service-manager');
const { S3BackendZipFileName, ProviderName } = require('./constants');
const { downloadZip, extractZip } = require('./zip-util');

async function run(context, envName, deleteS3) {
  const awsConfig = await loadConfigurationForEnv(context, envName);
  const cfn = await new Cloudformation(context, null, awsConfig);
  if (deleteS3) {
    const s3 = await new S3(context, {});
    const projectDetails = context.amplify.getProjectDetails();
    const projectBucket = projectDetails.teamProviderInfo[envName][ProviderName].DeploymentBucketName;
    if (await s3.ifBucketExists(projectBucket)) {
      const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
      const tempDir = path.join(amplifyDir, envName, '.temp');
      const storageBucket = await getStorageBucket(context, envName, s3, tempDir);
      fs.removeSync(tempDir);
      if (storageBucket) await s3.deleteS3Bucket(storageBucket);
      await s3.deleteS3Bucket(projectBucket);
    } else {
      context.print.info(`Unable to remove env: ${envName} because deployment bucket ${projectBucket} does not exist or has been deleted.`);
    }
  }
  await cfn.deleteResourceStack(envName);
  await deleteEnv(context, envName, awsConfig);
}

async function getStorageBucket(context, envName, s3, tempDir) {
  const sourceZipFile = await downloadZip(s3, tempDir, S3BackendZipFileName, envName);
  const unZippedDir = await extractZip(tempDir, sourceZipFile);
  const amplifyMeta = context.amplify.readJsonFile(`${unZippedDir}/amplify-meta.json`);
  const storage = amplifyMeta['storage'] || {};
  const s3Storage = Object.keys(storage).filter(r => storage[r].service === 'S3');
  if (!s3Storage.length) return;
  const fStorageName = s3Storage[0];
  return storage[fStorageName].output.BucketName;
}

module.exports = {
  run,
};
