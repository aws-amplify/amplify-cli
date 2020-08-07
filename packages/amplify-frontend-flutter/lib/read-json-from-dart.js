const fs = require('fs-extra');

function readJsonFromDart(jsonFilePath, encoding = 'utf8', throwOnError = true) {
  if (!fs.existsSync(jsonFilePath) && !throwOnError) {
    return undefined;
  }
  const fileContents = fs.readFileSync(jsonFilePath, encoding);
  let jsonValue = fileContents.substring(fileContents.indexOf('{'), fileContents.lastIndexOf('}') + 1);
  return JSON.parse(jsonValue);
}

module.exports = {
  readJsonFromDart,
};
