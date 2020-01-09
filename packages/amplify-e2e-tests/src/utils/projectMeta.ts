import * as path from 'path';
import * as fs from 'fs-extra';

function getProjectMeta(projectRoot: string) {
  const metaFilePath = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
}

function getAwsAndroidConfig(projectRoot: string) {
  const configPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getAwsIOSConfig(projectRoot: string) {
  const configPath = path.join(projectRoot, 'awsconfiguration.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export { getProjectMeta, getAwsAndroidConfig, getAwsIOSConfig };
