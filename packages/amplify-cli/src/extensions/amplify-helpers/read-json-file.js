const fs = require('fs-extra');

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

function readJsonFile(jsonFilePath, encoding = 'utf8', throwOnError = true) {
  if (!fs.existsSync(jsonFilePath) && !throwOnError) {
    return undefined;
  }
  return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}

module.exports = {
  readJsonFile,
};
