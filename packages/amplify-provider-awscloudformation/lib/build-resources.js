import path from 'path';
import fs from 'fs-extra';
import { ServiceName } from 'amplify-category-function';

async function run(context, category, resourceName) {
  const { allResources } = await context.amplify.getResourceStatus(category, resourceName);

  const resources = allResources.filter(resource => resource.service === ServiceName.LambdaFunction).filter(resource => resource.build);

  const buildPromises = [];
  for (let i = 0; i < resources.length; i += 1) {
    buildPromises.push(buildResource(context, resources[i]));
  }
  return Promise.all(buildPromises);
}

// This function is a translation layer around the previous buildResource
// For legacy purposes, the method builds and packages the resource
async function buildResource(context, resource) {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), resource.category, resource.resourceName);
  let breadcrumbs = context.amplify.readBreadcrumbs(context, resource.category, resource.resourceName);

  let zipFilename = resource.distZipFilename;

  const runtimePlugin = await context.amplify.loadRuntimePlugin(context, breadcrumbs.pluginId);

  const depCheck = await runtimePlugin.checkDependencies();
  if (!depCheck.hasRequiredDependencies) {
    context.print.error(depCheck.errorMessage || `You are missing dependencies required to package ${resource.resourceName}`);
    throw new Error(`Missing required dependencies to package ${resource.resourceName}`);
  }

  // build the function
  let rebuilt = false;
  if (breadcrumbs.scripts && breadcrumbs.scripts.build) {
    // TODO
    throw new Error('Executing custom build scripts is not yet implemented');
  } else {
    const buildRequest = {
      env: context.amplify.getEnvInfo().envName,
      srcRoot: resourcePath,
      runtime: breadcrumbs.functionRuntime,
      legacyBuildHookParams: {
        projectRoot: context.amplify.pathManager.searchProjectRootPath(),
        resourceName: resource.resourceName,
      },
      lastBuildTimestamp: resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined,
    };
    rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
  }
  context.amplify.updateamplifyMetaAfterBuild(resource);

  // package the function
  const distDir = path.join(resourcePath, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  const destination = path.join(distDir, 'latest-build.zip');
  let packagePromise;
  if (breadcrumbs.scripts && breadcrumbs.scripts.package) {
    // TODO
    throw new Error('Executing custom package scripts is not yet implemented');
  } else {
    const packageRequest = {
      env: context.amplify.getEnvInfo().envName,
      srcRoot: resourcePath,
      dstFilename: destination,
      runtime: breadcrumbs.functionRuntime,
      lastPackageTimestamp: resource.lastPackageTimestamp ? new Date(resource.lastPackageTimestamp) : undefined,
      lastBuildTimestamp: rebuilt ? new Date() : new Date(resource.lastBuildTimeStamp),
    };
    packagePromise = runtimePlugin.package(packageRequest);
  }
  return new Promise((resolve, reject) => {
    packagePromise
      .then(result => {
        const packageHash = result.packageHash;
        zipFilename = packageHash ? `${resource.resourceName}-${packageHash}-build.zip` : zipFilename;
        context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename);
        resolve({ zipFilename, zipFilePath: destination });
      })
      .catch(err => reject(new Error(`Package command failed with error [${err}]`)));
  });
}

module.exports = {
  run,
  buildResource,
};
