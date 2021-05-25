const titleCaseModule = require('title-case');

function convertString(s) {
  return titleCaseModule.titleCase(s);
}

module.exports = {
  convertString,
};
