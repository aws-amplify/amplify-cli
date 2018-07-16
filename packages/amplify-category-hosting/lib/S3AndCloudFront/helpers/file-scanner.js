const fs = require('fs-extra');
const path = require('path');

// get the last modification time of the directory including its files and subdirectories
function getDirContentMTime(dirPath, ignoredDirs, ignoredFiles) {
  let mtime;
  if (fs.existsSync(dirPath)) {
    mtime = recursiveGetDirContentMTime(dirPath, ignoredDirs, ignoredFiles);
  }
  return mtime;
}

function recursiveGetDirContentMTime(dirPath, ignoredDirs, ignoredFiles) {
  let { mtime } = fs.lstatSync(dirPath);
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const stat = fs.lstatSync(path.join(dirPath, files[i]));
    if (stat.isDirectory()) {
      if (ignoredDirs.indexOf(files[i]) < 0) {
        const subDirMtime = recursiveGetDirContentMTime(path.join(dirPath, files[i]));
        mtime = (mtime > subDirMtime) ? mtime : subDirMtime;
      }
    } else if (ignoredFiles.indexOf(files[i]) < 0) {
      const fileMtime = stat.mtime;
      mtime = (mtime > fileMtime) ? mtime : fileMtime;
    }
  }
  return mtime;
}

function scan(dir, ignoredDirs, ignoredFiles) {
  let fileList = [];
  if (fs.existsSync(dir)) {
    fileList = recursiveScan(dir, [], ignoredDirs, ignoredFiles);
  }
  return fileList;
}

function findFile(dir, filename) {
  let result;
  if (fs.existsSync(dir)) {
    const filelist = recursiveFindFile(dir, filename, []);
    if (filelist.length > 0) {
      [result] = filelist;
    }
  }
  return result;
}

function recursiveFindFile(dir, filename, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = recursiveFindFile(path.join(dir, file), filename, filelist);
    } else if (file === filename) {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

function recursiveScan(dir, filelist, ignoredDirs, ignoredFiles) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (ignoredDirs.indexOf(file) < 0) {
        filelist = recursiveScan(path.join(dir, file), filelist, ignoredDirs, ignoredFiles);
      }
    } else if (ignoredFiles.indexOf(file) < 0) {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

module.exports = {
  getDirContentMTime,
  scan,
  findFile,
};

