import { join } from 'path';
export default function getProjectMeta(projectRoot) {
  const metaFilePath = join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return require(metaFilePath)
}