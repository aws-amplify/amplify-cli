import { $TSAny, $TSContext, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { ProjectLayer } from 'amplify-function-plugin-interface';
import AsyncLock from 'async-lock';
import chalk from 'chalk';
import chokidar from 'chokidar';
import fs from 'fs';
import ora from 'ora';
import path from 'path';
import { buildFunction } from './buildFunction';
import { ServiceName } from './constants';
import { packageResource } from './package';

const asyncLock = new AsyncLock();

export async function startWatcher(context: $TSContext) {
  const spinner = ora('Initializing...').start();
  const lambdaClient = await getLambdaSdk(context);
  spinner.succeed('Initialized');

  chokidar
    .watch(path.join(pathManager.getBackendDirPath(), 'function'), {
      ignoreInitial: true,
      ignored: /(dist|bin|obj|.*awscloudformation-template.json)/,
    })
    .on('all', (_event, changedPath) => {
      onFileChange(context, lambdaClient, changedPath);
    });
}

async function onFileChange(context: $TSContext, lambdaClient: $TSAny, changedPath: string) {
  const resourcesToBuild = await getResourcesToBuild(context, changedPath);

  await Promise.all(
    resourcesToBuild.map(async resource => {
      const { resourceName } = resource;

      if (asyncLock.isBusy(resourceName)) {
        return;
      }

      chalk.green(`Changes detected at ${changedPath}`);

      await asyncLock.acquire(resourceName, async () => {
        const zipFile = await createZip(context, resource);
        if (!zipFile) {
          chalk.yellow('There was no change in the package');
          return;
        }

        switch (resource.service) {
          case ServiceName.LambdaFunction:
            return updateFunction(context, lambdaClient, resourceName, zipFile);
          case ServiceName.LambdaLayer:
            return updateLayer(context, lambdaClient, resourceName, zipFile);
          default: // passthrough
        }
      });
    }),
  );
}

async function getLambdaSdk(context: $TSContext) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  return providerPlugin.getLambdaSdk(context);
}

async function getResourcesToBuild(context: $TSContext, changedPath: string) {
  const resourceName = findResourceNameByChangedPath(changedPath);
  if (!resourceName) return [];

  const resourceStatus = await context.amplify.getResourceStatus('function', resourceName);
  const { allResources } = resourceStatus;
  return allResources
    .filter(resource => resource.build)
    .filter(resource => resource.service === ServiceName.LambdaFunction || resource.service === ServiceName.LambdaLayer);
}

function findResourceNameByChangedPath(changedPath: string): string | null {
  const { sep } = path;
  const match = changedPath.match(new RegExp(`function${sep}([^${sep}]*)${sep}`));
  if (!match) return null;

  return match[1];
}

async function createZip(context: $TSContext, resource: $TSAny) {
  resource.lastBuildTimeStamp = await buildFunction(context, resource);

  const { newPackageCreated, zipFilePath } = await packageResource(context, resource);
  if (!newPackageCreated) return;

  return fs.promises.readFile(zipFilePath);
}

async function updateFunction(context: $TSContext, lambdaClient: $TSAny, resourceName: string, zipFile: Buffer) {
  const spinner = ora(`Updating function code... ${resourceName}`).start();

  try {
    const amplifyMeta = stateManager.getMeta();
    const categoryAmplifyMeta = amplifyMeta.function;
    const functionArn = categoryAmplifyMeta[resourceName].output.Arn;

    await lambdaClient.updateFunctionCode(functionArn, zipFile);

    spinner.succeed(`Function update successful ${resourceName}`);
  } catch (e) {
    spinner.fail(`Function update failed ${resourceName}`);
    throw e;
  } finally {
    spinner.stop();
  }
}

async function updateLayer(context: $TSContext, lambdaClient: $TSAny, resourceName: string, zipFile: Buffer) {
  const spinner = ora(`Updating layer code... ${resourceName}`).start();

  try {
    const { runtimes } = JSONUtilities.readJson<{ runtimes: string[] }>(
      path.join(pathManager.getBackendDirPath(), 'function', resourceName, 'parameters.json'),
    );
    const layer = await lambdaClient.updateLayer(resourceName, runtimes, zipFile);

    const amplifyMeta = stateManager.getMeta();
    const categoryAmplifyMeta = amplifyMeta.function;

    await Promise.all(
      findReferencedFunctionNames(context, resourceName).map(dependencyResourceName =>
        updateLayerVersion(categoryAmplifyMeta, lambdaClient, layer, dependencyResourceName),
      ),
    );

    spinner.succeed(`Layer code update successful ${resourceName}`);
  } catch (e) {
    spinner.fail(`Layer code update failed ${resourceName}`);
    throw e;
  } finally {
    spinner.stop();
  }
}

function findReferencedFunctionNames(context: $TSContext, resourceName: string): string[] {
  const amplifyMeta = stateManager.getMeta();
  const categoryAmplifyMeta = amplifyMeta.function;

  return Object.keys(categoryAmplifyMeta)
    .map(key => {
      return { key, value: categoryAmplifyMeta[key] };
    })
    .filter(({ key, value: { dependsOn } }) => {
      if (!dependsOn) return false;

      const dependency = dependsOn.find(dependency => dependency.resourceName === resourceName);
      if (!dependency) return false;

      const parametersJSONPath = path.join(pathManager.getBackendDirPath(), 'function', key, 'function-parameters.json');
      const { lambdaLayers } = JSONUtilities.readJson<{ lambdaLayers: ProjectLayer[] }>(parametersJSONPath);
      const isLatestDependency = Boolean(lambdaLayers.find(layer => layer.resourceName === resourceName && layer.isLatestVersionSelected));

      return dependency && isLatestDependency;
    })
    .map(({ key }) => key)
    .sort();
}

async function updateLayerVersion(categoryAmplifyMeta: $TSAny, lambdaClient: $TSAny, layer: $TSAny, resourceName: string) {
  const spinner = ora(`Updating function layer configuration... ${resourceName}`).start();

  try {
    const functionArn = categoryAmplifyMeta[resourceName].output.Arn;
    await asyncLock.acquire(resourceName, () => lambdaClient.updateLayerVersion(functionArn, layer.LayerVersionArn));

    spinner.succeed(`Function layer configuration update successful ${resourceName}`);
  } catch (e) {
    spinner.fail(`Function layer configuration update failed ${resourceName}`);
    throw e;
  } finally {
    spinner.stop();
  }
}
