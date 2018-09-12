const fs = require('fs-extra');
const path = require('path');
const publishConfig = require('./configure-Publish');

function scan(context, distributionDirPath) {
  let fileList = [];
  if (fs.existsSync(distributionDirPath)) {
    const ignored = publishConfig.getIgnore(context);
    fileList = recursiveScan(distributionDirPath, [], ignored, distributionDirPath);
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

