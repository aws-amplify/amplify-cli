const fs = require('fs-extra');
const path = require('path');
const publishConfig = require('./configure-Publish');

function scan(context, distributionDirPath, indexDoc) {
  let fileList = [];
  if (fs.existsSync(distributionDirPath)) {
    const ignored = publishConfig.getIgnore(context);
    fileList = recursiveScan(distributionDirPath, [], ignored, distributionDirPath);
    if (fileList.length === 0) {
      const message = 'The distribution folder is empty';
      context.print.info(''); 
      context.print.error(message);
      context.print.info('Distribution folder is currently set as:'); 
      context.print.info(`  ${distributionDirPath}`);
      context.print.info(''); 
      throw new Error(message);
    } else if (!fs.existsSync(path.join(distributionDirPath, indexDoc))) {
      context.print.info(''); 
      context.print.warning('Index doc is missing in the distribution folder');
      context.print.info('Distribution folder is currently set as:'); 
      context.print.info(`  ${distributionDirPath}`);
      context.print.info('Index document is currently set as:'); 
      context.print.info(`  ${indexDoc}`);
      context.print.info(''); 
    }
  } else {
    const message = 'Can not find the distribution folder.';
    context.print.info(''); 
    context.print.error(message);
    context.print.info('Distribution folder is currently set as:'); 
    context.print.info(`  ${distributionDirPath}`);
    context.print.info(''); 
    throw new Error(message);
  }
  return fileList;
}

function recursiveScan(dir, filelist, amplifyIgnore, ignoreRoot) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!publishConfig.isIgnored(filePath, amplifyIgnore, ignoreRoot)) {
        filelist = recursiveScan(filePath, filelist, amplifyIgnore, ignoreRoot);
      }
    } else if (!publishConfig.isIgnored(filePath, amplifyIgnore, ignoreRoot)) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

module.exports = {
  scan,
};

