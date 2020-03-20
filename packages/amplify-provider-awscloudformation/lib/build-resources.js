import path from 'path';
import fs from 'fs-extra';

async function run(context, category, resourceName) {
  const { allResources } = await context.amplify.getResourceStatus(category, resourceName);

  const resources = allResources.filter(resource => resource.build);
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
  if (!breadcrumbs) {
    // fallback to old behavior for backwards compatibility and store breadcrumbs for future use
    breadcrumbs = {
      pluginId: 'amplify-nodejs-function-runtime-provider',
      functionRuntime: 'nodejs',
      useLegacyBuild: true,
    };
    context.amplify.leaveBreadcrumbs(context, resource.category, resource.resourceName, breadcrumbs);
  }

  let zipFilename = resource.distZipFilename;

  const runtimePlugin = await loadRuntimePlugin(context, breadcrumbs.pluginId);

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

async function loadRuntimePlugin(context, pluginId) {
  const pluginMeta = context.pluginPlatform.plugins.functionRuntime.find(meta => meta.manifest.functionRuntime.pluginId === pluginId);
  if (!pluginMeta) {
    throw new Error(`Could not find runtime plugin with id [${pluginId}] to build the resource ${resource.resourceName}`);
  }
  try {
    const plugin = await import(pluginMeta.packageLocation);
    return plugin.functionRuntimeContributorFactory(context);
  } catch (err) {
    throw new Error(`Could not load runtime plugin with id [${pluginId}]. Underlying error is ${err}`);
  }
}

module.exports = {
  run,
  buildResource,
};
