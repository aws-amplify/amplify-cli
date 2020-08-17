const fs = require('fs-extra');
const path = require('path');

function readJsonFromDart(jsonFilePath, encoding = 'utf8', throwOnError = true) {
  if (!fs.existsSync(jsonFilePath) && !throwOnError) {
    return undefined;
  }
  const fileContents = fs.readFileSync(jsonFilePath, encoding);
  let jsonValue = fileContents.substring(fileContents.indexOf('{'), fileContents.lastIndexOf('}') + 1);
  return JSON.parse(jsonValue);
}

function writeJsonToDart(dest, obj) {
  const destPath = path.parse(dest).dir;
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }
  const dartContent = `const amplifyconfig = ''' ${obj}''';`;
  fs.writeFileSync(dest, dartContent);
}

module.exports = {
  readJsonFromDart,
  writeJsonToDart,
};
