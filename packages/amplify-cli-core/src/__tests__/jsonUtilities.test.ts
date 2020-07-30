import { JSONUtilities } from '../jsonUtilities';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { v4 as uuid } from 'uuid';

describe('JSONUtilities tests', () => {
  const jsonString = `{
  // Here is some comments for this json
  "foo": "bar",
  "bar": 1 // Line comments
}`;

  const defaultData = {
    foo: 'bar',
    bar: 1,
  };

  test('readJson successfully reads file', async () => {
    const fileName = path.join(__dirname, 'testFiles', 'test.json');

    const data = await JSONUtilities.readJson(fileName);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('readJson successfully reads file with BOM', async () => {
    const fileName = path.join(__dirname, 'testFiles', 'testWithBOM.json');

    const data = await JSONUtilities.readJson(fileName);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('readJson throws error when fileName is not specified', async () => {
    await expect(async () => {
      const _ = await JSONUtilities.readJson((undefined as unknown) as string);
    }).rejects.toThrowError(`'fileName' argument missing`);
  });

  test('readJson throws error for non-existing file', async () => {
    await expect(async () => {
      const _ = await JSONUtilities.readJson('/test.json');
    }).rejects.toThrowError(`File at path: '/test.json' does not exist`);
  });

  test('readJson does not throw error for non-existing file when flag specified', async () => {
    const data = await JSONUtilities.readJson('/test.json', {
      throwIfNotExist: false,
    });

    expect(data).toBeUndefined();
  });

  test('writeJson successfully writes file and creating nested directories', async () => {
    const osTempDir = await fs.realpath(os.tmpdir());
    const topTempDir = path.join(osTempDir, `amp-${uuid()}`);
    const nestedTempDir = path.join(topTempDir, 'f1', 'f2');
    const fileName = path.join(nestedTempDir, 'test.json');

    try {
      await JSONUtilities.writeJson(fileName, defaultData);

      // Test if overwrite succeeds as well
      await JSONUtilities.writeJson(fileName, defaultData);

      const data = await JSONUtilities.readJson(fileName);

      expect(data).toMatchObject({
        foo: 'bar',
        bar: 1,
      });
    } finally {
      rimraf.sync(topTempDir);
    }
  });

  test('writeJson throws error when fileName is not specified', async () => {
    await expect(async () => {
      const _ = await JSONUtilities.writeJson((undefined as unknown) as string, (undefined as unknown) as string);
    }).rejects.toThrowError(`'fileName' argument missing`);
  });

  test('writeJson throws error when data is not specified', async () => {
    await expect(async () => {
      const _ = await JSONUtilities.writeJson('test.json', (undefined as unknown) as string);
    }).rejects.toThrowError(`'data' argument missing`);
  });

  test('JSON parse returns object', () => {
    const data = JSONUtilities.parse(jsonString);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('JSON parse with BOM', () => {
    const withBom = '\ufeff' + jsonString;
    const data = JSONUtilities.parse(withBom);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('JSON roundtrip preserve comments', () => {
    const data = JSONUtilities.parse(jsonString, { preserveComments: true });
    const roundtrippedString = JSONUtilities.stringify(data, {
      keepComments: true,
    });

    expect(jsonString).toEqual(roundtrippedString);
  });

  test('stringify compatible with builtin JSON.stringify', () => {
    const data = JSONUtilities.parse(jsonString);
    const hjsonString = JSONUtilities.stringify(data);
    const builtinJsonString = JSON.stringify(data, null, 2);

    expect(hjsonString).toEqual(builtinJsonString);
  });

  test('minified stringify using builtin JSON.stringify', () => {
    const data = JSONUtilities.parse(jsonString);
    const hjsonString = JSONUtilities.stringify(data, { minify: true });
    const builtinJsonString = JSON.stringify(data);

    expect(hjsonString).toEqual(builtinJsonString);
  });

  test('JSON parse throws error when jsonString is undefined', () => {
    expect(() => {
      const _ = JSONUtilities.parse((undefined as unknown) as string);
    }).toThrowError(`'jsonString' argument missing`);
  });

  test('JSON stringify throws error when data is undefined', () => {
    expect(() => {
      const _ = JSONUtilities.stringify((undefined as unknown) as any);
    }).toThrowError(`'data' argument missing`);
  });

  test('malformed JSON throws error', () => {
    expect(() => {
      const malformedJsonString = `{
  // Here is some comments for this json
  "foo" "bar",
  "bar": 1 // Line comments
`;

      const _ = JSONUtilities.parse(malformedJsonString);
    }).toThrowError(`Expected ':' instead of '"' at line 3,9 >>>  "foo" "bar",`);
  });
});
