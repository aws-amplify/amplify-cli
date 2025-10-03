import fs from 'fs-extra';
import { EOL } from 'os';
import path from 'path';
import { categoryName, topLevelCommentPrefix, topLevelCommentSuffix } from '../../../constants';
import _ from 'lodash';
import { pathManager } from '@aws-amplify/amplify-cli-core';
/**
 * This is legacy code that has been copied here.
 * In the future we either need to get rid of the top level comment entirely, or create a template hook to modify it
 */
export const tryUpdateTopLevelComment = (resourceDirPath: string, envVars: string[]) => {
  const sourceFilePath = getSourceFilePath(resourceDirPath);
  if (!sourceFilePath) {
    return;
  }
  const newComment = createTopLevelComment(envVars);
  updateTopLevelComment(sourceFilePath, newComment);
};

const createTopLevelComment = (envVars: string[]) => `${topLevelCommentPrefix}${envVars.sort().join(`${EOL}\t`)}${topLevelCommentSuffix}`;

const updateTopLevelComment = (filePath, newComment) => {
  const commentRegex = new RegExp(`${_.escapeRegExp(topLevelCommentPrefix)}[a-zA-Z0-9\\-\\s._=]+${_.escapeRegExp(topLevelCommentSuffix)}`);
  let fileContents = fs.readFileSync(filePath).toString();
  const commentMatches = fileContents.match(commentRegex);
  if (!commentMatches || commentMatches.length === 0) {
    fileContents = newComment + fileContents;
  } else {
    fileContents = fileContents.replace(commentRegex, newComment);
  }
  fs.writeFileSync(filePath, fileContents);
};

const getSourceFilePath = (resourceDirPath: string): string | undefined => {
  const appJSFilePath = path.join(resourceDirPath, 'src', 'app.js');
  const indexJSFilePath = path.join(resourceDirPath, 'src', 'index.js');
  return fs.existsSync(appJSFilePath) ? appJSFilePath : fs.existsSync(indexJSFilePath) ? indexJSFilePath : undefined;
};

export const tryPrependSecretsUsageExample = async (functionName: string, secretNames: string[]): Promise<void> => {
  const sourceFilePath = getSourceFilePath(path.join(pathManager.getBackendDirPath(), categoryName, functionName));
  if (!sourceFilePath) {
    return;
  }
  const secretsHeader = secretNames?.length > 0 ? secretsUsageTemplate(secretNames) : '';
  let fileContent = await fs.readFile(sourceFilePath, 'utf8');
  const match = fileContent.match(secretsUsageRegex);
  if (match?.length > 0) {
    fileContent = fileContent.replace(secretsUsageRegex, secretsHeader);
  } else {
    fileContent = secretsHeader + fileContent;
  }
  await fs.writeFile(sourceFilePath, fileContent);
};

const secretsUsageHeader = `/*${EOL}Use the following code to retrieve configured secrets from SSM:`;

const secretsUsageFooter = `Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]${EOL}*/${EOL}`;

const secretsUsageTemplate = (secretNames: string[]) =>
  `${secretsUsageHeader}

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient();
const { Parameters } = await client.send(new GetParametersCommand({
  Names: ${JSON.stringify(secretNames)}.map(secretName => process.env[secretName]),
  WithDecryption: true,
}));

${secretsUsageFooter}`;

const secretsUsageRegex = new RegExp(`${_.escapeRegExp(secretsUsageHeader)}.+${_.escapeRegExp(secretsUsageFooter)}`, 'sm');
