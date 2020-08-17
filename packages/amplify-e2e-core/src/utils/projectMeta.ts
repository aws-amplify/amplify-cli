import * as path from 'path';
import * as fs from 'fs-extra';

function getFeatureFlagConfig(projRoot: string) {
  const featureFlagPath = path.join(projRoot, 'amplify.json');
  return JSON.parse(fs.readFileSync(featureFlagPath, 'utf8'));
}

function updateFeatureFlagConfig(projRoot: string, config: Object) {
  const featureFlagPath = path.join(projRoot, 'amplify.json');
  fs.writeFileSync(featureFlagPath, config);
}

function getAWSConfigAndroidPath(projRoot: string): string {
  return path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json');
}

function getAmplifyConfigAndroidPath(projRoot: string): string {
  return path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
}

function getAmplifyConfigIOSPath(projRoot: string): string {
  return path.join(projRoot, 'amplifyconfiguration.json');
}

function getAmplifyDirPath(projRoot: string) {
  return path.join(projRoot, 'amplify');
}

function getAWSConfigIOSPath(projRoot: string): string {
  return path.join(projRoot, 'awsconfiguration.json');
}

function getProjectMeta(projectRoot: string) {
  const metaFilePath = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
}

function getBackendAmplifyMeta(projectRoot: string) {
  const metaFilePath = path.join(projectRoot, 'amplify', 'backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
}

function getS3StorageBucketName(projectRoot: string) {
  const meta = getProjectMeta(projectRoot);
  const storage = meta['storage'];
  const s3 = Object.keys(storage).filter(r => storage[r].service === 'S3');
  const fStorageName = s3[0];
  return storage[fStorageName].output.BucketName;
}

function getAwsAndroidConfig(projectRoot: string) {
  const configPath = getAWSConfigAndroidPath(projectRoot);
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getAwsIOSConfig(projectRoot: string) {
  const configPath = getAWSConfigIOSPath(projectRoot);
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export {
  getProjectMeta,
  getBackendAmplifyMeta,
  getAwsAndroidConfig,
  getAwsIOSConfig,
  getAWSConfigAndroidPath,
  getAmplifyConfigAndroidPath,
  getAmplifyConfigIOSPath,
  getAWSConfigIOSPath,
  getS3StorageBucketName,
  getAmplifyDirPath,
  getFeatureFlagConfig,
  updateFeatureFlagConfig
};
