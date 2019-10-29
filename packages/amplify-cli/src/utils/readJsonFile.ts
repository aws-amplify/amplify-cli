import fs from 'fs-extra';

function stripBOM(content: string) {
  // tslint:disable-next-line
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

export function readJsonFileSync(jsonFilePath: string, encoding: string = 'utf8'): any {
  return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}

export async function readJsonFile(jsonFilePath: string, encoding: string = 'utf8'): Promise<any> {
  const contents = await fs.readFile(jsonFilePath, encoding);
  return JSON.parse(stripBOM(contents));
}
