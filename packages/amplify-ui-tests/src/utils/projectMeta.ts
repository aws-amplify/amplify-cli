require = require('esm')(module);
import { join } from 'path';
import { readFileSync, existsSync, copyFileSync } from 'fs';
export default function getProjectMeta(projectRoot: string) {
  const metaFilePath = join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(readFileSync(metaFilePath, 'utf8'));
}
export function existsAWSExportsPath(projectRoot: string) : boolean {
  const metaFilePath = join(projectRoot, 'src', 'aws-exports.js')
  // const awsmobile = import(metaFilePath)
  // .then(myModule => myModule.default)
  return existsSync(metaFilePath)
}

export function copyAWSExportsToProj(projectRoot: string, destRoot: string, platform: string, testFolder: string) {
  const awsExporFiletPath = join(projectRoot, 'src', 'aws-exports.js')
  //const destFilePath = join(__dirname, '../../../../..', 'amplify-js-samples-staging/samples/react/auth/with-authenticator/src', 'aws-exports.js')
  //const destFilePath = join(destRoot, 'samples/react/auth/with-authenticator/src', 'aws-exports.js')
  const destFilePath = join(destRoot, 'samples', platform, testFolder, 'src', 'aws-exports.js')
  if (!existsSync(destFilePath)) {
    console.log('Path does not exist')
    return
  }
  copyFileSync(awsExporFiletPath, destFilePath)
}

export function getAWSMeta(projectRoot: string) {
  const metaFilePath = join(projectRoot, 'src', 'aws-exports.js')
  const awsMeta = require(metaFilePath).default;
  return awsMeta;
}