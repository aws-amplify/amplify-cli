import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Given a path to a json file, minify that file by reading in as JSON
 * and writing back out without any whitespace.
 * @param jsonFilePath the path to the JSON file we are going to minify.
 * @returns when the file has been minified and written back to disk.
 */
export const minifyJSONFile = (jsonFilePath: string): void => {
  if (!jsonFilePath.includes('.json')) return; // Don't convert files not ending in `.json`
  const originalJSON = fs.readFileSync(jsonFilePath, 'utf-8');
  const minifiedJSON = JSON.stringify(JSON.parse(originalJSON));
  fs.writeFileSync(jsonFilePath, minifiedJSON);
};

/**
 * Recursively walk a folder, and minify (print without whitespace) all the json files you discover
 * @param rootPath the top of the tree to walk
 */
export const minifyAllJSONInFolderRecursively = (rootPath: string): void => {
  fs.readdirSync(rootPath).forEach((childHandle) => {
    const childPath = path.join(rootPath, childHandle);
    if (fs.lstatSync(childPath).isDirectory()) minifyAllJSONInFolderRecursively(childPath);
    if (fs.lstatSync(childPath).isFile() && childPath.includes('.json')) minifyJSONFile(childPath);
  });
};
