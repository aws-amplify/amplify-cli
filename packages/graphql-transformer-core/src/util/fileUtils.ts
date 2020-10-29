import * as path from 'path';
import { Readable } from 'stream';
const fs = require('fs-extra');

/**
 * Helpers
 */

export async function emptyDirectory(directory: string) {
  const pathExists = await fs.exists(directory);
  if (!pathExists) {
    return;
  }
  const dirStats = await fs.lstat(directory);
  if (!dirStats.isDirectory()) {
    return;
  }
  const files = await fs.readdir(directory);
  for (const fileName of files) {
    const fullPath = path.join(directory, fileName);
    await fs.remove(fullPath);
  }
}

export async function writeToPath(directory: string, obj: any): Promise<void> {
  if (Array.isArray(obj)) {
    await fs.ensureDir(directory);
    for (let i = 0; i < obj.length; i++) {
      const newDir = path.join(directory, `${i}`);
      await writeToPath(newDir, obj[i]);
    }
  } else if (typeof obj === 'object') {
    await fs.ensureDir(directory);
    for (const key of Object.keys(obj)) {
      const newDir = path.join(directory, key);
      await writeToPath(newDir, obj[key]);
    }
  } else if (typeof obj === 'string') {
    fs.writeFileSync(directory, obj);
  }
}

/**
 * Recursively read the contents of a directory into an object.
 * @param directory The directory to read.
 */
export async function readFromPath(directory: string): Promise<any> {
  const pathExists = await fs.exists(directory);
  if (!pathExists) {
    return;
  }
  const dirStats = await fs.lstat(directory);
  if (!dirStats.isDirectory()) {
    const buf = await fs.readFile(directory);
    return buf.toString();
  }
  const files = await fs.readdir(directory);
  const accum = {};
  for (const fileName of files) {
    const fullPath = path.join(directory, fileName);
    const value = await readFromPath(fullPath);
    accum[fileName] = value;
  }
  return accum;
}

export type FileHandler = (file: { Key: string; Body: Buffer | string | Readable }) => Promise<string>;

/**
 * Uploads a file with exponential backoff up to a point.
 * @param opts The deployment options
 * @param key The bucket key
 * @param body The blob body as a buffer
 * @param backoffMS The time to wait this invocation
 * @param numTries The max number of tries
 */
export async function handleFile(
  handler: FileHandler,
  key: string,
  body: Buffer | string | Readable,
  backoffMS: number = 500,
  numTries: number = 3,
) {
  try {
    return await handler({
      Key: key,
      Body: body,
    });
  } catch (e) {
    if (numTries > 0) {
      await new Promise((res, rej) => setTimeout(() => res(), backoffMS));
      await handleFile(handler, key, body, backoffMS * 2, numTries - 1);
    }
    throw e;
  }
}

export function throwIfNotJSONExt(stackFile: string) {
  const extension = path.extname(stackFile);
  if (extension === '.yaml' || extension === '.yml') {
    throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`);
  }
  if (extension !== '.json') {
    throw new Error(`Invalid extension ${extension} for stack ${stackFile}`);
  }
}
