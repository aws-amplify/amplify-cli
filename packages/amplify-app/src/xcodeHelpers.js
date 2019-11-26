const xcode = require('xcode');
const path = require('path');
const fs = require('fs-extra');

async function getXcodeProjectDir() {
  const EXTENSION = '.xcodeproj';
  const files = fs.readdirSync(process.cwd());
  const targetFiles = files.filter(function extenstionFilter(file) {
    return path.extname(file).toLowerCase() === EXTENSION;
  });
  let projDir;
  if (targetFiles.length) {
    projDir = path.join(process.cwd(), targetFiles[0], '/project.pbxproj');
  }
  return projDir;
}

async function addFileToXcodeProj(file) {
  const projectPath = await getXcodeProjectDir();
  // Silently return if not in same directory as xcode project
  if (!projectPath) {
    return;
  }
  const myProj = xcode.project(projectPath);
  return new Promise((resolve, reject) =>
    myProj.parse(function parseCallback(err) {
      // hash of the group we add the files to, in this case the root of the xcode project
      let hash = '';
      Object.entries(myProj.hash.project.objects.PBXGroup).forEach(entry => {
        const [key, value] = entry;
        // only the root pbx group can have no name, path or description
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
