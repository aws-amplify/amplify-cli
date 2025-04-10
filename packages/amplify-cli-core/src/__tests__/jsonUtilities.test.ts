import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { rimraf } from 'rimraf';
import { v4 as uuid } from 'uuid';
import { JSONUtilities } from '../jsonUtilities';

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

  test('readJson successfully reads file', () => {
    const fileName = path.join(__dirname, 'testFiles', 'test.json');

    const data = JSONUtilities.readJson(fileName);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('readJson successfully reads file with BOM', () => {
    const fileName = path.join(__dirname, 'testFiles', 'testWithBOM.json');

    const data = JSONUtilities.readJson(fileName);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('readJson throws error when fileName is not specified', () => {
    expect(() => {
      JSONUtilities.readJson(undefined as unknown as string);
    }).toThrowError(`'fileName' argument missing`);
  });

  test('readJson throws error for non-existing file', () => {
    expect(() => {
      JSONUtilities.readJson('/test.json');
    }).toThrowError(`File at path: '/test.json' does not exist`);
  });

  test('readJson does not throw error for non-existing file when flag specified', () => {
    const data = JSONUtilities.readJson('/test.json', {
      throwIfNotExist: false,
    });

    expect(data).toBeUndefined();
  });

  test('writeJson successfully writes file and creating nested directories', () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const osTempDir = fs.realpathSync(os.tmpdir());
    const topTempDir = path.join(osTempDir, `amp-${uuid()}`);
    const nestedTempDir = path.join(topTempDir, 'f1', 'f2');
    const fileName = path.join(nestedTempDir, 'test.json');

    try {
      JSONUtilities.writeJson(fileName, defaultData);

      // Test if overwrite succeeds as well
      JSONUtilities.writeJson(fileName, defaultData);

      const data = JSONUtilities.readJson(fileName);

      expect(data).toMatchObject({
        foo: 'bar',
        bar: 1,
      });
    } finally {
      rimraf.sync(topTempDir);
    }
  });

  test('writeJson throws error when fileName is not specified', () => {
    expect(() => {
      JSONUtilities.writeJson(undefined as unknown as string, undefined as unknown as string);
    }).toThrowError(`'fileName' argument missing`);
  });

  test('writeJson throws error when data is not specified', () => {
    expect(() => {
      JSONUtilities.writeJson('test.json', undefined as unknown as string);
    }).toThrowError(`'data' argument missing`);
  });

  test('JSON parse returns object', () => {
    const data = JSONUtilities.parse(jsonString);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test('JSON parse with BOM', () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const withBom = `\ufeff${jsonString}`;
    const data = JSONUtilities.parse(withBom);

    expect(data).toMatchObject({
      foo: 'bar',
      bar: 1,
    });
  });

  test.skip('JSON roundtrip preserve comments', () => {
    const data = JSONUtilities.parse(jsonString, { preserveComments: true });
    const roundTripString = JSONUtilities.stringify(data);

    expect(jsonString).toEqual(roundTripString);
  });

  test('JSON parse returns successfully for non-string parameters', () => {
    const result1 = JSONUtilities.parse(true as unknown as string);
    expect(result1).toBe(true);

    const result2 = JSONUtilities.parse(false as unknown as string);
    expect(result2).toBe(false);

    const result3 = JSONUtilities.parse(12345 as unknown as string);
    expect(result3).toBe(12345);

    const result4 = JSONUtilities.parse(12345.67 as unknown as string);
    expect(result4).toBe(12345.67);

    const result5 = JSONUtilities.parse('12345' as unknown as string);
    expect(result5).toBe(12345);

    const result6 = JSONUtilities.parse('12345.67' as unknown as string);
    expect(result6).toBe(12345.67);
  });

  test('stringify compatible with builtin JSON.stringify', () => {
    const data = JSONUtilities.parse(jsonString);
    const utilsString = JSONUtilities.stringify(data);
    const builtinJsonString = JSON.stringify(data, null, 2);

    expect(utilsString).toEqual(builtinJsonString);
  });

  test('minified stringify using builtin JSON.stringify', () => {
    const data = JSONUtilities.parse(jsonString);
    const utilsString = JSONUtilities.stringify(data, { minify: true });
    const builtinJsonString = JSON.stringify(data);

    expect(utilsString).toEqual(builtinJsonString);
  });

  test('JSON parse throws error when jsonString is undefined', () => {
    expect(() => {
      JSONUtilities.parse(undefined as unknown as string);
    }).toThrowError(`'jsonString' argument missing or empty`);
  });

  test('JSON parse throws error when jsonString is empty string', () => {
    expect(() => {
      JSONUtilities.parse('');
    }).toThrowError(`'jsonString' argument missing or empty`);
  });

  test('JSON stringify throws error when data is undefined', () => {
    expect(() => {
      JSONUtilities.stringify(undefined as unknown as any);
    }).toThrowError(`'data' argument missing`);
  });

  test('malformed JSON throws error', () => {
    expect(() => {
      const malformedJsonString = `{
  // Here is some comments for this json
  "foo" "bar",
  "bar": 1 // Line comments
`;

      JSONUtilities.parse(malformedJsonString);
    }).toThrowError(`Expected ':' instead of '"' at line 3,9 >>>  "foo" "bar",`);
  });
});
