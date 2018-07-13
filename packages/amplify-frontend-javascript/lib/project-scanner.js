const fs = require('fs-extra');
const path = require('path');
const constants = require('./constants');

function run(projectPath) {
  let score = constants.ProjectScanBaseScore;
  const packageJsonFilePath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonFilePath)) {
    score = constants.ProjectScanMaxScore;
  }
  return score;
}

module.exports = {
  run,
};
