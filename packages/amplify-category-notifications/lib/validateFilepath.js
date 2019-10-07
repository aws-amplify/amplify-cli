const fs = require('fs-extra');

module.exports = filepath => {
  let result = false;
  if (filepath) {
    result = fs.existsSync(filepath);
  }
  return result || 'file path must be valid';
};
