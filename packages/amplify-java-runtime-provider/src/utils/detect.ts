import os from 'os';
import childProcess from 'child_process';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';

export async function checkDependencies(runtimeValue: string): Promise<CheckDependenciesResult> {
  if (checkJava() && checkGradle()) {
    return Promise.resolve({ hasRequiredDependencies: true });
  }
  return Promise.resolve({ hasRequiredDependencies: false });
}

async function checkJava() {
  const packageManager = 'java';
  const args = ['--version'];
  const cwd = __dirname;
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output.join());
  }
}

async function checkGradle() {
  const packageManager = 'gradle';
  const args = ['-v'];
  const cwd = __dirname;
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output.join());
  }
}
