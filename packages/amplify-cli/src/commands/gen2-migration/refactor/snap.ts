import { CreateStackRefactorCommandInput, UpdateStackCommandInput } from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';
import * as path from 'path';
import extractStackNameFromId from './utils';

export const OUTPUT_DIRECTORY = `.amplify/refactor.operations`;

export async function preUpdateStack(input: UpdateStackCommandInput) {
  makeDirectory(OUTPUT_DIRECTORY);
  const stackName = extractStackNameFromId(input.StackName);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `update.${stackName}.template.json`), formatTemplateBody(input.TemplateBody));
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `update.${stackName}.parameters.json`), JSON.stringify(input.Parameters ?? [], null, 2));
}

export async function preRefactorStack(input: CreateStackRefactorCommandInput) {
  makeDirectory(OUTPUT_DIRECTORY);
  const source = input.StackDefinitions[0];
  const target = input.StackDefinitions[1];
  const sourceStackName = extractStackNameFromId(source.StackName);
  const targetStackName = extractStackNameFromId(target.StackName);
  const description = `refactor.__from__.${sourceStackName}.__to__.${targetStackName}`;
  const basePath = path.join(OUTPUT_DIRECTORY, description);
  fs.writeFileSync(`${basePath}.source.template.json`, formatTemplateBody(source.TemplateBody));
  fs.writeFileSync(`${basePath}.target.template.json`, formatTemplateBody(target.TemplateBody));
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `${description}.mappings.json`), JSON.stringify(input.ResourceMappings ?? [], null, 2));
}

function makeDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatTemplateBody(templateBody: string) {
  return JSON.stringify(JSON.parse(templateBody), null, 2);
}
