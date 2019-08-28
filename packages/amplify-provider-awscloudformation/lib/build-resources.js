const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { hashElement } = require('folder-hash');
const childProcess = require('child_process');

async function run(context, category, resourceName) {
  const { allResources } = await context.amplify.getResourceStatus(category, resourceName);

  const resources = allResources.filter(resource => resource.build);
  const buildPromises = [];
  for (let i = 0; i < resources.length; i += 1) {
    buildPromises.push(buildResource(context, resources[i]));
  }
  return Promise.all(buildPromises);
}
async function buildResource(context, resource) {
  const { category, resourceName } = resource;
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const projectRoot = context.amplify.pathManager.searchProjectRootPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName, 'src'));
  const packageJsonPath = path.normalize(path.join(backEndDir, category, resourceName, 'src', 'package.json'));
  const packageJsonMeta = fs.statSync(packageJsonPath);
  const distDir = path.normalize(path.join(backEndDir, category, resourceName, 'dist'));

  let zipFilename = resource.distZipFilename;
  let zipFilePath = zipFilename ? path.normalize(path.join(distDir, 'latest-build.zip')) : '';

  if (
    !resource.lastBuildTimeStamp ||
    new Date(packageJsonMeta.mtime) > new Date(resource.lastBuildTimeStamp)
  ) {
    installDependencies(resourceDir);
    context.amplify.updateamplifyMetaAfterBuild(resource);
  }

  runBuildScriptHook(resourceName, projectRoot);

  if (
    !resource.lastPackageTimeStamp ||
    !resource.distZipFilename ||
    isPackageOutdated(resourceDir, resource.lastPackageTimeStamp)
  ) {
    // generating hash, ignoring node_modules as this can take long time to hash
    // the content inside node_modules change only when content of package-lock.json changes
    const { hash: folderHash } = await hashElement(resourceDir, {
      folders: { exclude: ['node_modules'] },
    });

    zipFilename = `${resourceName}-${Buffer.from(folderHash)
      .toString('hex')
      .substr(0, 20)}-build.zip`;

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }

    zipFilePath = path.normalize(path.join(distDir, 'latest-build.zip'));
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

function runBuildScriptHook(resourceName, projectRoot) {
  const scriptName = `amplify:${resourceName}`;
  if (scriptExists(projectRoot, scriptName)) {
    runPackageManager(projectRoot, scriptName);
  }
}

function scriptExists(projectRoot, scriptName) {
  const packageJsonPath = path.normalize(path.join(projectRoot, 'package.json'));
  if (fs.existsSync(packageJsonPath)) {
    const rootPackageJsonContents = require(packageJsonPath);
    return rootPackageJsonContents.scripts && rootPackageJsonContents.scripts[scriptName];
  }
  return false;
}

function installDependencies(resourceDir) {
  runPackageManager(resourceDir);
}

function runPackageManager(cwd, scriptName = undefined) {
  const isWindows = /^win/.test(process.platform);
  const npm = isWindows ? 'npm.cmd' : 'npm';
  const yarn = isWindows ? 'yarn.cmd' : 'yarn';
  const useYarn = fs.existsSync(`${cwd}/yarn.lock`);
  const packageManager = useYarn ? yarn : npm;
  const args = toPackageManagerArgs(useYarn, scriptName);
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output);
  }
}

function toPackageManagerArgs(useYarn, scriptName) {
  if (scriptName) {
    return useYarn ? [scriptName] : ['run-script', scriptName];
  }
  return useYarn ? [] : ['install'];
}

function isPackageOutdated(resourceDir, lastPackageTimeStamp) {
  const lastPackageDate = new Date(lastPackageTimeStamp);
  const sourceFiles = getSourceFiles(resourceDir, 'node_modules');
  const dirMTime = fs.statSync(resourceDir).mtime;
  if (new Date(dirMTime) > lastPackageDate) {
    return true;
  }

  for (let i = 0; i < sourceFiles.length; i += 1) {
    const file = sourceFiles[i];
    const fileMTime = fs.statSync(file).mtime;
    if (new Date(fileMTime) > lastPackageDate) {
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
