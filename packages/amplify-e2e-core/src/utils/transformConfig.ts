import * as path from 'path';
import * as fs from 'fs-extra';
import { TRANSFORM_CONFIG_FILE_NAME, TransformConfig } from 'graphql-transformer-core';

export function getTransformConfig(projectRoot: string, apiName: string): TransformConfig {
  const metaFilePath = path.join(projectRoot, 'amplify', 'backend', 'api', apiName, TRANSFORM_CONFIG_FILE_NAME);
  return <TransformConfig>JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
}

export function setTransformConfig(projectRoot: string, apiName: string, config) {
  const metaFilePath = path.join(projectRoot, 'amplify', 'backend', 'api', apiName, TRANSFORM_CONFIG_FILE_NAME);

  fs.writeFileSync(metaFilePath, JSON.stringify(config, null, 2));
}
