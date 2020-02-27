const fs = require('fs-extra');
const parseJson = require('parse-json');

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

function readJsonFile(jsonFilePath, encoding = 'utf8') {
  const content = fs.readFileSync(jsonFilePath, encoding);
  return parseJson(stripBOM(content), jsonFilePath);
}

module.exports = {
  readJsonFile,
};
