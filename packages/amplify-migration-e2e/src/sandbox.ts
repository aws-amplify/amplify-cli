import { getNpxPath, nspawn as spawn } from '@aws-amplify/amplify-e2e-core';
import { pushTimeoutMS } from '.';
import execa from 'execa';

export async function runGen2SandboxCommand(cwd: string) {
  const processResult = execa.sync(getNpxPath(), ['ampx', 'sandbox', '--once'], {
    cwd,
    env: { ...process.env, npm_config_user_agent: 'npm' },
    encoding: 'utf-8',
  });
  if (processResult.exitCode === 0) {
    const match = processResult.stdout.match(/arn:aws:cloudformation:.*:stack\/([^/]+)\//);
    if (match) {
      return match[1];
    } else {
      throw new Error('Stack name not found in the command output');
    }
  } else {
    throw new Error(`Sandbox command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

export function deleteGen2Sandbox(cwd: string) {
  return spawn(getNpxPath(), ['ampx', 'sandbox', 'delete'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  })
    .wait("Are you sure you want to delete all the resources in your sandbox environment (This can't be undone)?")
    .sendConfirmYes()
    .wait('Finished deleting.')
    .runAsync();
}
