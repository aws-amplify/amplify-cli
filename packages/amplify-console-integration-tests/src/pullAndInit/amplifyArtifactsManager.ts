import * as path from 'path';
import * as fs from 'fs-extra';
import * as util from '../util';

export function removeFilesForTeam(projectRootDirPath: string) {
  const amplifyDirPath = path.join(projectRootDirPath, 'amplify');

  const dotConfigDirPath = path.join(amplifyDirPath, '.config');
  const files = fs.readdirSync(dotConfigDirPath);
  files.forEach(fileName => {
    if (fileName.includes('local')) {
      const filePath = path.join(dotConfigDirPath, fileName);
      fs.removeSync(filePath);
    }
  });

  const currentCloudBackendDirPath = path.join(amplifyDirPath, '#current-cloud-backend');
  const mockDataDirPath = path.join(amplifyDirPath, 'mock-data');
  fs.removeSync(mockDataDirPath);
  fs.removeSync(currentCloudBackendDirPath);

  const backendDirPath = path.join(amplifyDirPath, 'backend');
  const amplifyMetaFilePath = path.join(backendDirPath, 'amplify-meta.json');
  const awsCloudFormationDirPath = path.join(backendDirPath, 'awscloudformation');
  fs.removeSync(awsCloudFormationDirPath);
  fs.removeSync(amplifyMetaFilePath);
}

export function removeFilesForThirdParty(projectRootDirPath: string) {
  removeFilesForTeam(projectRootDirPath);
  removeTeamProviderInfo(projectRootDirPath);
}

function removeTeamProviderInfo(projectRootDirPath: string) {
  const teamProviderInfoFilePath = path.join(projectRootDirPath, 'amplify', 'team-provider-info.json');
  fs.removeSync(teamProviderInfoFilePath);
}

export function checkAmplifyFolderStructure(projectRootDirPath: string): boolean {
  const amplifyDirPath = path.join(projectRootDirPath, 'amplify');
  const teamProviderInfoFilePath = path.join(amplifyDirPath, 'team-provider-info.json');

  const dotConfigDirPath = path.join(amplifyDirPath, '.config');
  const localAWSInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');
  const localEnvInfoFilePath = path.join(dotConfigDirPath, 'local-env-info.json');
  const projectConfigFilePath = path.join(dotConfigDirPath, 'project-config.json');

  const currentCloudBackendDirPath = path.join(amplifyDirPath, '#current-cloud-backend');
  const currentAmplifyMetaFilePath = path.join(currentCloudBackendDirPath, 'amplify-meta.json');

  const backendDirPath = path.join(amplifyDirPath, 'backend');
  const amplifyMetaFilePath = path.join(backendDirPath, 'amplify-meta.json');

  return (
    fs.existsSync(amplifyDirPath) &&
    fs.existsSync(teamProviderInfoFilePath) &&
    fs.existsSync(dotConfigDirPath) &&
    fs.existsSync(localAWSInfoFilePath) &&
    fs.existsSync(localEnvInfoFilePath) &&
    fs.existsSync(projectConfigFilePath) &&
    fs.existsSync(currentCloudBackendDirPath) &&
    fs.existsSync(currentAmplifyMetaFilePath) &&
    fs.existsSync(backendDirPath) &&
    fs.existsSync(amplifyMetaFilePath)
  );
}

export function getTeamProviderInfo(projectRootDirPath: string) {
  let teamProviderInfo;
  const teamProviderInfoFilePath = path.join(projectRootDirPath, 'amplify', 'team-provider-info.json');
  if (fs.existsSync(teamProviderInfoFilePath)) {
    teamProviderInfo = util.readJsonFileSync(teamProviderInfoFilePath);
  }
  return teamProviderInfo;
}
