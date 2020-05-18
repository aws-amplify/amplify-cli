import * as fs from 'fs-extra';

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

export function readJsonFile(jsonFilePath, encoding = 'utf8') {
  return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}
