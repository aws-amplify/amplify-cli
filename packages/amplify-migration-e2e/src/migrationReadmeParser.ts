import path from 'node:path';
import * as fs from 'fs-extra';
import { RefactorCategory } from './templategen';

function extractContent(readmeContent: string, startRegex: string, endRegex: string) {
  const pattern = new RegExp(`${startRegex}([\\s\\S]*?)${endRegex}`, 'i');
  const match = readmeContent.match(pattern);

  if (match && match[1]) {
    return match[1].trim();
  }
  throw new Error('README file parsing failed to get the stack refactor commands');
}

function extractCommands(readmeContent: string) {
  const pattern = /```([\s\S]*?)```/g;
  const matches = readmeContent.matchAll(pattern);
  const commands = [];

  for (const match of matches) {
    if (match[1]) {
      commands.push(match[1].trim());
    }
  }
  if (commands.length === 0) {
    throw new Error('README file parsing failed to get the stack refactor commands');
  }
  return commands;
}

export function readMigrationReadmeFile(projRoot: string, category: RefactorCategory, encoding: BufferEncoding = 'utf8') {
  const readmeFilePath = path.join(projRoot, '.amplify', 'migration', 'templates', category, 'MIGRATION_README.md');
  const readmeContent = fs.readFileSync(readmeFilePath, encoding);
  return readmeContent;
}

/**
 * Sample from the README file for STEP 1:
 *
 * ### STEP 1: UPDATE GEN-1 AUTH STACK
 *
 * It is a non-disruptive update since the template only replaces resource references with their resolved values. This is a required step to execute cloudformation stack refactor later.
 *
 * ```
 * aws cloudformation update-stack \
 *  --stack-name my-auth-stack-name \
 *  --template-body file://path/to/template.json \
 *  --parameters '[{"ParameterKey":"authRoleArn","ParameterValue":"arn:aws:iam::123456789012:role/my-auth-role"},{"ParameterKey":"autoVerifiedAttributes","ParameterValue":"email"},{"ParameterKey":"allowUnauthenticatedIdentities","ParameterValue":"false"},{"ParameterKey":"smsVerificationMessage","ParameterValue":"Your verification code is {####}"}]' \
 *  --capabilities CAPABILITY_NAMED_IAM --tags '[]'
 * ```
 *
 * ```
 * aws cloudformation describe-stacks \
 *  --stack-name my-auth-stack-name
 * ```
 */
export function getStackRefactorCommandsFromReadme(readmeContent: string) {
  const step1Content = extractContent(readmeContent, '### STEP 1', '#### Rollback step');
  const step2Content = extractContent(readmeContent, '### STEP 2', '#### Rollback step');
  const step3Content = extractContent(readmeContent, '### STEP 3', '#### Rollback step');
  const step1Commands = extractCommands(step1Content);
  const step2commands = extractCommands(step2Content);
  const step3Commands = extractCommands(step3Content);
  // Pop first command from step3Commands
  step3Commands.shift();
  return { step1Commands, step2commands, step3Commands };
}

export function getRollbackCommandsFromReadme(readmeContent: string) {
  const step1Content = extractContent(readmeContent, '#### Rollback step', '### STEP 2');
  const step2Content = extractContent(readmeContent, '### STEP 2[\\s\\S]*?#### Rollback step', '### STEP 3');
  const step3Content = extractContent(readmeContent, '#### Rollback step for refactor:', '### STEP 4');
  const step1RollbackCommands = extractCommands(step1Content);
  const step2RollbackCommands = extractCommands(step2Content);
  const step3RollbackCommands = extractCommands(step3Content);
  return { step1RollbackCommands, step2RollbackCommands, step3RollbackCommands };
}
