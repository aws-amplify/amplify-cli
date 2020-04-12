const { makeId } = require('./make-id');

const validAlphanumericRegex = /^[a-zA-Z0-9]+$/;
const invalidAlphanumericRegex = /[^a-zA-Z0-9]/g;

function isProjectNameValid(projectName) {
  return projectName && projectName.length >= 3 && projectName.length <= 20 && validAlphanumericRegex.test(projectName);
}

function normalizeProjectName(projectName) {
  if (!projectName) {
    projectName = `amplify${makeId(5)}`;
  }
  if (!isProjectNameValid(projectName)) {
    projectName = projectName.replace(invalidAlphanumericRegex, '');
    if (projectName.length < 3) {
      // add a random id to project name if too short
      projectName += makeId(5);
    } else if (projectName.length > 20) {
      projectName = projectName.substring(0, 20);
    }
  }
  return projectName;
}

module.exports = {
  validAlphanumericRegex,
  invalidAlphanumericRegex,
  isProjectNameValid,
  normalizeProjectName,
};
