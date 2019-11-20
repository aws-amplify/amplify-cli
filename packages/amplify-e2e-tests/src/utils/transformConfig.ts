import { join } from 'path';
import { readFileSync } from 'fs-extra';
import { TRANSFORM_CONFIG_FILE_NAME, TransformConfig } from 'graphql-transformer-core';
export function getTransformConfig(projectRoot: string, apiName: string): TransformConfig {
  const metaFilePath = join(projectRoot, 'amplify', 'backend', 'api', apiName, TRANSFORM_CONFIG_FILE_NAME);
  return <TransformConfig>JSON.parse(readFileSync(metaFilePath, 'utf8'));
}
