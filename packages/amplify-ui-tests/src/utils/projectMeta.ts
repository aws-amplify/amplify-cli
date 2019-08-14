import { join } from 'path';
import { readFileSync, existsSync, copyFileSync } from 'fs';

const metaFilePathDic = {
  js: "src/aws-exports.js",
  android: "app/src/main/res/raw/awsconfiguration.json",
  ios: "awsconfiguration.json"
}

export default function getProjectMeta(projectRoot: string) {
  const metaFilePath = join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(readFileSync(metaFilePath, 'utf8'));
}
export function existsAWSExportsPath(projectRoot: string, platform: string) : boolean {
  const metaFilePath = join(projectRoot, metaFilePathDic[platform])
  return existsSync(metaFilePath)
}

export function copyAWSExportsToProj(projectRoot: string, destRoot: string) {
  const awsExporFiletPath = join(projectRoot, 'src', 'aws-exports.js')
  const destFilePath = join(destRoot, 'src', 'aws-exports.js')
  copyFileSync(awsExporFiletPath, destFilePath)
}