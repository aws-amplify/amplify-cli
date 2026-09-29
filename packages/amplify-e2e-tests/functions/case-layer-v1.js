const upperCaseModule = require('upper-case');

function convertString(s) {
  return upperCaseModule.upperCase(s);
}

module.exports = {
  convertString,
};
