const fs = require('fs-extra');
const path = require('path');
const publishIgnore = require('./publish-ignore'); 

function scan(context, dir) {
  let fileList = [];
  if (fs.existsSync(dir)) {
    const amplifyIgnore = publishIgnore.getAmplifyIgnore(context); 
    fileList = recursiveScan(dir, [], amplifyIgnore);
  }
  return fileList;
}

function recursiveScan(dir, filelist, amplifyIgnore) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (!publishIgnore.isIgnored(file, amplifyIgnore)) {
        filelist = recursiveScan(path.join(dir, file), filelist, amplifyIgnore);
      }
    } else if (!publishIgnore.isIgnored(file, amplifyIgnore)) {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

module.exports = {
  scan
};

