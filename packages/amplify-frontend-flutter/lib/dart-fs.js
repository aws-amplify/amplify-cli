const fs = require('fs-extra');
const path = require('path');

function readJsonFromDart(jsonFilePath, encoding = 'utf8', throwOnError = true) {
  if (!fs.existsSync(jsonFilePath) && !throwOnError) {
    return undefined;
  }
  const fileContents = fs.readFileSync(jsonFilePath, encoding);
  const configStart = fileContents.indexOf('const amplifyconfig');
  if (configStart === -1) {
    return undefined;
  }
  const QUOTE = "'''";
  const jsonStart = fileContents.indexOf(QUOTE, configStart) + QUOTE.length;
  const jsonEnd = fileContents.indexOf(QUOTE, jsonStart);
  const jsonValue = fileContents.substring(jsonStart, jsonEnd).trim();
  return JSON.parse(jsonValue);
}

function writeJsonToDart(dest, json) {
  const destPath = path.parse(dest).dir;
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }
  const dartContent = `const amplifyconfig = '''${json}''';\n`;
  fs.writeFileSync(dest, dartContent);
}

module.exports = {
  readJsonFromDart,
  writeJsonToDart,
};
