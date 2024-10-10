import { getProjectSchema } from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import path from 'node:path';

export function copyGen1Schema(projRoot: string, projName: string) {
  const gen1Schema = getProjectSchema(path.join(projRoot, '.amplify', 'migration'), projName);

  const dataResourcePath = path.join(projRoot, 'amplify', 'data', 'resource.ts');
  const dataResourceContent = fs.readFileSync(dataResourcePath, 'utf-8');

  const backendPath = path.join(projRoot, 'amplify', 'backend.ts');
  let backendContent = fs.readFileSync(backendPath, 'utf-8');

  const schemaRegex = /"TODO: Add your existing graphql schema here"/;
  const updatedContent = dataResourceContent.replace(schemaRegex, `\`${gen1Schema.trim()}\``);

  const errorRegex = /throw new Error\("TODO: Add Gen 1 GraphQL schema"\);?\s*/;
  const finalContent = updatedContent.replace(errorRegex, '');

  fs.writeFileSync(dataResourcePath, finalContent, 'utf-8');

  const linesToAdd = `
    const todoTable = backend.data.resources.cfnResources.additionalCfnResources['Todo'];
    todoTable.addOverride('Properties.sseSpecification', { sseEnabled: false });
    `;

  backendContent += linesToAdd;
  fs.writeFileSync(backendPath, backendContent, 'utf-8');
}
