import { join } from 'path';
import { readFileSync } from 'fs';
export default function getProjectMeta(projectRoot: string) {
  const metaFilePath = join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(readFileSync(metaFilePath, 'utf8'));
}
