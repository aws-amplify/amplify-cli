import fs from 'fs-extra';

function stripBOM(content: string) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

export default function readJsonFile(jsonFilePath: string, encoding: string = 'utf8') {
  return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}