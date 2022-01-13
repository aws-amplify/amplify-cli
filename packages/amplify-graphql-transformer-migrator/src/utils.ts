import { $TSObject, AmplifySupportedService, stateManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import _ from 'lodash';

export type SchemaDocument = {
  schema: string;
  filePath: string;
};

export type DiffDocument = {
  schemaDiff: string;
  filePath: string;
};

export async function replaceFile(newSchema: string, filePath: string): Promise<void> {
  await fs.writeFile(filePath, newSchema, { encoding: 'utf-8', flag: 'w' });
}

export function combineSchemas(schemaDocs: SchemaDocument[]): string {
  let schemaList: string[] = new Array(schemaDocs.length);
  schemaDocs.forEach((doc, idx) => {
    schemaList[idx] = doc.schema;
  });

  return schemaList.join('\n');
}

export async function getDefaultAuth(): Promise<string> {
  const backendConfig = stateManager.getBackendConfig();

  // Only support one GraphQL API, so grab the ID
  const [gqlAPI] = _.filter(backendConfig.api, (api: $TSObject) => api.service === AmplifySupportedService.APPSYNC);

  if (!gqlAPI) {
    return 'AMAZON_COGNITO_USER_POOLS';
  }
  return gqlAPI.output.authConfig.defaultAuthentication.authenticationType;
}

export function listContainsOnlySetString(list: Array<string>, set: Set<string>): Array<string> {
  return list.filter(str => {
    return !set.has(str);
  });
}
