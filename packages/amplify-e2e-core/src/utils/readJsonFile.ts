import fs from 'fs-extra';
import parseJson from 'parse-json';

function stripBOM(content: string) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

export function readJsonFileSync(jsonFilePath: string, encoding: string = 'utf8'): any {
  const content = fs.readFileSync(jsonFilePath, encoding);
  return parseJson(stripBOM(content), jsonFilePath);
}

export async function readJsonFile(jsonFilePath: string, encoding: string = 'utf8'): Promise<any> {
  const content = await fs.readFile(jsonFilePath, encoding);
  return parseJson(stripBOM(content), jsonFilePath);
}
