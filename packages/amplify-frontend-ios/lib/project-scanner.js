const fs = require('fs-extra');
const path = require('path');
const constants = require('./constants');

function run(projectPath) {
  let score = constants.ProjectScanBaseScore;
  const dirs = fs.readdirSync(projectPath);
  for (let i = 0; i < dirs.length; i += 1) {
    const dir = dirs[i];
    if (fs.statSync(path.join(projectPath, dir)).isDirectory()) {
      if (/\.xcodeproj$/.test(dir)) {
        score = constants.ProjectScanMaxScore;
        break;
      }
    }
  }
  return score;
}

module.exports = {
  run,
};
