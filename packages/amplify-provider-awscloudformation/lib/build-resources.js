const fs = require('fs');
const path = require('path');
const moment = require('moment');
const archiver = require('archiver');

async function run(context, category, resourceName) {
  const { allResources } = await context.amplify.getResourceStatus(category, resourceName);

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
  const distDir = path.normalize(path.join(backEndDir, category, resourceName, 'dist'));

  let zipFilename = resource.distZipFilename;
  let zipFilePath = zipFilename ? path.normalize(path.join(distDir, zipFilename)) : '';


  if (!resource.lastBuildTimeStamp ||
    new Date(packageJsonMeta.mtime) > new Date(resource.lastBuildTimeStamp)) {
    const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    require('child_process').spawnSync(npm, ['install'], { cwd: resourceDir });
    context.amplify.updateamplifyMetaAfterBuild(resource);
  }

  if (!resource.lastPackageTimeStamp || !resource.distZipFilename ||
    isPackageOutdated(resourceDir, resource.lastPackageTimeStamp)) {
    zipFilename = `${resourceName}-${moment().unix()}-latest-build.zip`;

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }

    zipFilePath = path.normalize(path.join(distDir, zipFilename));
    const output = fs.createWriteStream(zipFilePath);

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename);
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

  return new Promise(resolve => resolve({ zipFilename, zipFilePath }));
}
function isPackageOutdated(resourceDir, lastPackageTimeStamp) {
  const lastPackageDate = new Date(lastPackageTimeStamp);
  const sourceFiles = getSourceFiles(resourceDir, 'node_modules');

  for (let i = 0; i < sourceFiles.length; i += 1) {
    const file = sourceFiles[i];
    const { mtime } = fs.statSync(file);
    if (new Date(mtime) > lastPackageDate) {
      return true;
    }
  }
  return false;
}

function getSourceFiles(dir, ignoredDir) {
  if (!fs.statSync(dir).isDirectory()) return [dir];
  return fs.readdirSync(dir).reduce((acc, f) => {
    if (f === ignoredDir) {
      return acc;
    }
    return acc.concat(getSourceFiles(path.join(dir, f)));
  }, []);
}

module.exports = {
  run,
  buildResource,
};
