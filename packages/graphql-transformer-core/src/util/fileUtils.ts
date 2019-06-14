import * as fs from 'fs';
import * as path from 'path';

/**
 * Promisify common operations.
 */

export const readDir = async (dir: string) => await promisify<string, string[]>(fs.readdir, dir)
export const readFile = async (p: string) => await promisify(fs.readFile, p)
export const writeFile = async (p: string, d: any, opts: any = {}) => await new Promise((res) => fs.writeFile(p, d, opts, e => res(e)))
export const lstat = async (dir: string) => await promisify(fs.lstat, dir)
export const mkdir = async (p: string) => await new Promise((res) => fs.mkdir(p, e => res(e)))
export const exists = async (p: string) => await new Promise((res) => fs.exists(p, e => res(e)))
export const unlink = async (p: string) => await new Promise((res, rej) => fs.unlink(p, e => e ? rej(e) : res()))
export const rmdir = async (p: string) => await new Promise((res, rej) => fs.rmdir(p, e => e ? rej(e) : res()))
function promisify<A, O>(fn: (arg: A, cb: (err: Error, data: O) => void) => void, a: A): Promise<O> {
    return new Promise((res, rej) => {
        fn(a, (err, d) => {
            err ? rej(err) : res(d)
        })
    })
}

/**
 * Helpers
 */

export async function deleteDirectory(directory: string): Promise<void> {
    const pathExists = await exists(directory);
    if (!pathExists) {
        return;
    }
    await emptyDirectory(directory);
    await rmdir(directory);
}

export async function emptyDirectory(directory: string) {
    const pathExists = await exists(directory);
    if (!pathExists) {
        return;
    }
    const dirStats = await lstat(directory);
    if (!dirStats.isDirectory()) {
        return;
    }
    const files = await readDir(directory);
    for (const fileName of files) {
        const fullPath = path.join(directory, fileName);
        const stats = await lstat(fullPath);
        if (stats.isDirectory()) {
            await deleteDirectory(fullPath);
        } else if (stats.isFile()) {
            await unlink(fullPath);
        }
    }
}

/**
 * Make if not exists.
 */
export async function mkdirIfNone(dir: string) {
    const pathExists = await exists(dir);
    if (!pathExists) {
        await mkdir(dir)
    }
}

export async function writeToPath(directory: string, obj: any): Promise<void> {
    if (Array.isArray(obj)) {
        await mkdirIfNone(directory);
        for (let i = 0; i < obj.length; i++) {
            const newDir = path.join(directory, `${i}`);
            await writeToPath(newDir, obj[i]);
        }
    } else if (typeof obj === 'object') {
        await mkdirIfNone(directory);
        for (const key of Object.keys(obj)) {
            const newDir = path.join(directory, key);
            await writeToPath(newDir, obj[key])
        }
    } else if (typeof obj === 'string') {
        fs.writeFileSync(directory, obj)
    }
}

/**
 * Recursively read the contents of a directory into an object.
 * @param directory The directory to read.
 */
export async function readFromPath(directory: string): Promise<any> {
    const pathExists = await exists(directory);
    if (!pathExists) {
        return;
    }
    const dirStats = await lstat(directory);
    if (!dirStats.isDirectory()) {
        const buf = await readFile(directory);
        return buf.toString();
    }
    const files = await readDir(directory);
    const accum = {};
    for (const fileName of files) {
        const fullPath = path.join(directory, fileName);
        const value = await readFromPath(fullPath);
        accum[fileName] = value;
    }
    return accum;
}

/**
 * Recursively clear the contents at some path. Might be a file or directory.
 * @param clearPath The path to clear.
 */
export async function clearAtPath(clearPath: string) {
    const pathExists = await exists(clearPath);
    if (pathExists) {
        const dirStats = await lstat(clearPath);
        if (dirStats.isDirectory()) {
            await deleteDirectory(clearPath);
        } else {
            await unlink(clearPath);
        }
    }
}

export type FileHandler = (file: { Key: string, Body: Buffer | string}) => Promise<string>;
/**
 * Uploads a file with exponential backoff up to a point.
 * @param opts The deployment options
 * @param key The bucket key
 * @param body The blob body as a buffer
 * @param backoffMS The time to wait this invocation
 * @param numTries The max number of tries
 */
export async function handleFile(handler: FileHandler, key: string, body: Buffer, backoffMS: number = 500, numTries: number = 3) {
    try {
        return await handler({
            Key: key,
            Body: body
        })
    } catch (e) {
        if (numTries > 0) {
            await new Promise((res, rej) => setTimeout(() => res(), backoffMS))
            await handleFile(handler, key, body, backoffMS * 2, numTries - 1)
        }
        throw e
    }
}

export async function walkDirRec(
    dir: string, handler: FileHandler, relativePath: string = '', joinPath: (...paths: string[]) => string
) {
    const files = await readDir(dir)
    for (const file of files) {
        const resourcePath = path.join(dir, file)
        const newRelPath = joinPath(relativePath, file)
        const isDirectory = (await lstat(resourcePath)).isDirectory()
        if (isDirectory) {
            await walkDirRec(resourcePath, handler, newRelPath, joinPath)
        } else {
            const resourceContents = await readFile(resourcePath);
            await handleFile(handler, newRelPath, resourceContents)
        }
    }
}

export async function walkDir(dir: string, handler: (file: { Key: string, Body: Buffer | string}) => Promise<string>) {
    return await walkDirRec(dir, handler, '', path.join);
}
export async function walkDirPosix(dir: string, handler: (file: { Key: string, Body: Buffer | string}) => Promise<string>) {
    return await walkDirRec(dir, handler, '', path.posix.join);
}

export function throwIfNotJSONExt(stackFile: string) {
    const nameParts = stackFile.split('.');
    const extension = nameParts[nameParts.length - 1];
    if (extension === "yaml" || extension === "yml") {
        throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`)
    }
    if (extension !== "json") {
        throw new Error(`Invalid extension .${extension} for stack ${stackFile}`);
    }
}
