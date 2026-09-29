import { minifyJSONFile, minifyAllJSONInFolderRecursively } from '../../utils/minify-json';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const JSON_STRING = `{
  "city": "Seattle",
  "state": "WA"
}`;

const NON_JSON_STRING = `CITY = Seattle
STATE = WA
`;

describe('minifyJSONFile', () => {
  const writeFileMinifyAndReturnReadContents = (filePath: string, contents: string): string => {
    const tmpFilePath = path.join(os.tmpdir(), filePath);
    fs.writeFileSync(tmpFilePath, contents);
    minifyJSONFile(tmpFilePath);
    return fs.readFileSync(tmpFilePath, 'utf-8');
  };

  it('minifies JSON files', () => {
    const minifiedContents = writeFileMinifyAndReturnReadContents('testfile.json', JSON_STRING);
    expect(minifiedContents.length).toBeLessThan(JSON_STRING.length);
  });

  it('does not change a non-json file with json contents', () => {
    const minifiedContents = writeFileMinifyAndReturnReadContents('testfile.dat', JSON_STRING);
    expect(minifiedContents.length).toEqual(JSON_STRING.length);
  });

  it('does not change a non-json file with non-json contents', () => {
    const minifiedContents = writeFileMinifyAndReturnReadContents('testfile.env', NON_JSON_STRING);
    expect(minifiedContents.length).toEqual(NON_JSON_STRING.length);
  });
});

describe('minifyAllJSONInFolderRecursively', () => {
  it('will minify json files, but leave non-json files alone', () => {
    // This test will set up a directory structure as follows
    // .
    // ├── file.json
    // ├── config.env
    // └── nested_stacks
    //     ├── nested.env
    //     ├── nested_1.json
    //     ├── nested_2.json
    //     └── sub_nested_stacks
    //         ├── sub_nested.env
    //         └── sub_nested.json
    // We will then ensure that after a single invocation file.json, nested_1.json, nested_2.json, and sub_nested.json are all minified
    // and that config.env is the same length.
    const testDirectory = path.join(os.tmpdir(), 'minifyTestDir');
    const nestedStacksDirectory = path.join(testDirectory, 'nested_stacks');
    const subNestedStacksDirectory = path.join(nestedStacksDirectory, 'sub_nested_stacks');

    // Clean and setup directory structure
    fs.removeSync(testDirectory);
    fs.mkdirSync(testDirectory);
    fs.mkdirSync(nestedStacksDirectory);
    fs.mkdirSync(subNestedStacksDirectory);

    // Write files
    fs.writeFileSync(path.join(testDirectory, 'file.json'), JSON_STRING);
    fs.writeFileSync(path.join(testDirectory, 'config.env'), NON_JSON_STRING);
    fs.writeFileSync(path.join(nestedStacksDirectory, 'nested_1.json'), JSON_STRING);
    fs.writeFileSync(path.join(nestedStacksDirectory, 'nested_2.json'), JSON_STRING);
    fs.writeFileSync(path.join(nestedStacksDirectory, 'nested.env'), NON_JSON_STRING);
    fs.writeFileSync(path.join(subNestedStacksDirectory, 'sub_nested.json'), JSON_STRING);
    fs.writeFileSync(path.join(subNestedStacksDirectory, 'sub_nested.env'), NON_JSON_STRING);

    // Apply recursive minification
    minifyAllJSONInFolderRecursively(testDirectory);

    // Verify all `.json` files are minified, and `.env` files are not.
    expect(fs.readFileSync(path.join(testDirectory, 'file.json')).length).toBeLessThan(JSON_STRING.length);
    expect(fs.readFileSync(path.join(testDirectory, 'config.env')).length).toEqual(NON_JSON_STRING.length);
    expect(fs.readFileSync(path.join(nestedStacksDirectory, 'nested_1.json')).length).toBeLessThan(JSON_STRING.length);
    expect(fs.readFileSync(path.join(nestedStacksDirectory, 'nested_2.json')).length).toBeLessThan(JSON_STRING.length);
    expect(fs.readFileSync(path.join(nestedStacksDirectory, 'nested.env')).length).toEqual(NON_JSON_STRING.length);
    expect(fs.readFileSync(path.join(subNestedStacksDirectory, 'sub_nested.json')).length).toBeLessThan(JSON_STRING.length);
    expect(fs.readFileSync(path.join(subNestedStacksDirectory, 'sub_nested.env')).length).toEqual(NON_JSON_STRING.length);
  });
});
