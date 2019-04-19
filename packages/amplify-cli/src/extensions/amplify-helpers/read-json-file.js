const fs = require('fs-extra');

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

function readJsonFile(jsonFilePath, encoding = 'utf8') {
  return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}

module.exports = {
  readJsonFile,
};
