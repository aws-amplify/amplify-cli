import fs from 'fs-extra';
import path from 'path';
import * as execa from 'execa';

const jsonServerRootDirectory = path.join(__dirname, '..', 'resources', 'jsonServer');

export const deployJsonServer = () => {
  const jsonServerLambdaDirectory = path.join(jsonServerRootDirectory, 'src-server');
  const outputValuesFile = path.join(jsonServerRootDirectory, 'cdk.out', 'outputs.json');

  const yarnCdkResult = execa.sync('yarn', [], {
    cwd: jsonServerRootDirectory,
    stdio: 'inherit',
  });

  if (yarnCdkResult.exitCode !== 0) {
    throw new Error (`'yarn' failed with exit code: ${yarnCdkResult.exitCode}`);
  }

  const yarnServerResult = execa.sync('yarn', [], {
    cwd: jsonServerLambdaDirectory,
    stdio: 'inherit',
  });

  if (yarnServerResult.exitCode !== 0) {
    throw new Error (`'yarn' failed with exit code: ${yarnServerResult.exitCode}`);
  }

  const cdkDeployResult = execa.sync('npx', [
    'cdk',
    'deploy',
    '--outputsFile',
    outputValuesFile,
    '--require-approval',
    'never',
  ], {
    cwd: jsonServerRootDirectory,
    stdio: 'inherit',
  });

  if (cdkDeployResult.exitCode !== 0) {
    throw new Error (`CDK deploy failed with exit code: ${cdkDeployResult.exitCode}`);
  }

  if (!fs.existsSync(outputValuesFile)) {
    throw new Error (`CDK deploy failed, output values file: ${outputValuesFile} does not exist`);
  }

  const outputsContent = fs.readFileSync(outputValuesFile).toString();
  const outputValues = JSON.parse(outputsContent);

  const stackOutputs = outputValues['JsonMockStack'];
  const apiUrl = stackOutputs[Object.keys(stackOutputs)[0]];

  return {
    apiUrl
  };
};

export const destroyJsonServer = () => {
  const processResult = execa.sync('npx', [
    'cdk',
    'destroy',
    '--force',
  ], {
    cwd: jsonServerRootDirectory,
    stdio: 'inherit',
  });

  if (processResult.exitCode !== 0) {
    throw new Error (`CDK destroy failed with exit code: ${processResult.exitCode}`);
  }
};
