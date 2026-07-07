const fs = require('fs-extra');
const path = require('path');
const constants = require('./constants');

function run(projectPath) {
  let score = constants.ProjectScanBaseScore;
  const pubFilePath = path.join(projectPath, 'pubspec.yaml');
  if (fs.existsSync(pubFilePath)) {
    score = constants.ProjectScanMaxScore;
  }
  return score;
}

module.exports = {
  run,
};
