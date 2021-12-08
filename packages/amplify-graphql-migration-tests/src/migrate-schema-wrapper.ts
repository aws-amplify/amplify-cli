import { runMigration } from '@aws-amplify/graphql-transformer-migrator';
import * as fs from 'fs-extra';
import { prompter } from 'amplify-prompts';

jest.mock('fs-extra');
jest.mock('amplify-prompts');

const fs_mock = fs as jest.Mocked<typeof fs>;
const prompter_mock = prompter as jest.Mocked<typeof prompter>;

export type AuthMode = 'apiKey' | 'iam' | 'userPools' | 'oidc';

export const migrateSchema = async (schema: string, authMode: AuthMode = 'apiKey'): Promise<string> => {
  const pathHash = Date.now().toLocaleString().replace(/,/g, '');
  fs_mock.writeFile.mockClear();
  prompter_mock.pick.mockResolvedValue('Yes');
  await runMigration([{ schema, filePath: pathHash }], authMode);
  const transformedSchema = fs_mock.writeFile.mock.calls.find(([hash]) => hash === pathHash)?.[1];
  expect(typeof transformedSchema).toBe('string');
  return transformedSchema;
};
