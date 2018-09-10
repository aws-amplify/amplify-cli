const fs = require('fs-extra');
const path = require('path');
const publishIgnore = require('./publish-ignore'); 

function scan(context, distributionDirPath) {
  let fileList = [];
  if (fs.existsSync(distributionDirPath)) {
    const amplifyIgnore = publishIgnore.getAmplifyIgnore(context); 
    fileList = recursiveScan(distributionDirPath, [], amplifyIgnore, distributionDirPath);
  }
  return fileList;
}

function recursiveScan(dir, filelist, amplifyIgnore, ignoreRoot) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    const filePath = path.join(dir, file); 
    if (fs.statSync(filePath).isDirectory()) {
      if (!publishIgnore.isIgnored(filePath, amplifyIgnore, ignoreRoot)) {
        filelist = recursiveScan(filePath, filelist, amplifyIgnore, ignoreRoot);
      }
    } else if (!publishIgnore.isIgnored(filePath, amplifyIgnore, ignoreRoot)) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

module.exports = {
  scan
};

