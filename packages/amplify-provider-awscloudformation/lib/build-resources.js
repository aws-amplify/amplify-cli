const fs = require('fs');
const path = require('path');
const moment = require('moment');
const archiver = require('archiver');

function run(context, category, resourceName) {
  const { allResources } = context.amplify.getResourceStatus(category, resourceName);

  const resources = allResources.filter(resource => resource.build);
  const buildPromises = [];
  for (let i = 0; i < resources.length; i += 1) {
    buildPromises.push(buildResource(context, resources[i]));
  }
  return Promise.all(buildPromises);
}
function buildResource(context, resource) {
  const { category, resourceName } = resource;
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName, 'src'));
  const packageJsonPath = path.normalize(path.join(backEndDir, category, resourceName, 'src', 'package.json'));
  const packageJsonMeta = fs.statSync(packageJsonPath);
  const resourceDirMeta = fs.statSync(resourceDir);

  if (!resource.lastBuildTimeStamp ||
    new Date(packageJsonMeta.mtime) > new Date(resource.lastBuildTimeStamp)) {
    const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    require('child_process').spawnSync(npm, ['install'], { cwd: resourceDir });
    context.amplify.updateamplifyMetaAfterBuild(resource);
  }

  if (!resource.lastPackageTimeStamp ||
    new Date(resourceDirMeta.atime) > new Date(resource.lastPackageTimeStamp)) {
    const zipFilename = `${resourceName}-${moment().unix()}-latest-build.zip`;
    const distDir = path.normalize(path.join(backEndDir, category, resourceName, 'dist'));

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }

    const zipFilePath = path.normalize(path.join(distDir, zipFilename));
    const output = fs.createWriteStream(zipFilePath);

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        context.amplify.updateamplifyMetaAfterPackage(resource);
        resolve({ zipFilePath, zipFilename });
      });
      output.on('error', () => {
        reject(new Error('Failed to zip code.'));
      });
      const zip = archiver.create('zip', {});
      zip.pipe(output);
      zip.directory(resourceDir, false);
      zip.finalize();
    });
  }
}

module.exports = {
  run,
  buildResource,
};
