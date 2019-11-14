const xcode = require('xcode');
const path = require('path');
const fs = require('fs-extra');

function getXcodeProjectDir() {
  const EXTENSION = '.xcodeproj';
  const files = fs.readdirSync(process.cwd());
  const targetFiles = files.filter(function(file) {
    return path.extname(file).toLowerCase() === EXTENSION;
  });
  let projDir;
  if (targetFiles.length) {
    projDir = path.join(path.join(process.cwd(), targetFiles[0]), '/project.pbxproj');
  } else {
    projDir = undefined;
  }
  return projDir;
}

function addFileToXcodeProj(file) {
  const projectPath = getXcodeProjectDir();
  // Silently return if not in same directory as xcode project
  if (!projectPath) {
    return;
  }
  const myProj = xcode.project(projectPath);
  return new Promise((resolve, reject) =>
    myProj.parse(function(err) {
      let hash = '';
      Object.entries(myProj.hash.project.objects.PBXGroup).forEach(entry => {
        const [key, value] = entry;
        if (typeof value !== 'string' && value.name === undefined && value.path === undefined) {
          hash = key;
        }
      });
      myProj.addSourceFile(file, null, hash);
      fs.writeFileSync(projectPath, myProj.writeSync());
      if (err) {
        reject(err);
      }
      resolve();
    })
  );
}

module.exports = {
  addFileToXcodeProj,
};
