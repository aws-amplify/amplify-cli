import * as fs from 'fs-extra';
import * as path from 'path';
import * as hjson from 'hjson';

export class JSONUtilities {
  public static readJson = <T>(
    fileName: string,
    options?: {
      throwIfNotExist?: boolean;
      preserveComments?: boolean;
    },
  ): T | undefined => {
    if (!fileName) {
      throw new Error(`'fileName' argument missing`);
    }

    const mergedOptions = {
      throwIfNotExist: true,
      preserveComments: false,
      ...options,
    };

    if (!fs.existsSync(fileName)) {
      if (mergedOptions.throwIfNotExist) {
        throw new Error(`File at path: '${fileName}' does not exist`);
      } else {
        return undefined;
      }
    }

    const content = fs.readFileSync(fileName, 'utf8');

    const data = JSONUtilities.parse<T>(content, {
      preserveComments: mergedOptions.preserveComments,
    });

    return data as T;
  };

  public static writeJson = (
    fileName: string,
    data: any,
    options?: {
      keepComments?: boolean;
      mode?: number;
      minify?: boolean;
      secureFile?: boolean;
    },
  ): void => {
    if (!fileName) {
      throw new Error(`'fileName' argument missing`);
    }

    if (!data) {
      throw new Error(`'data' argument missing`);
    }

    const mergedOptions = {
      keepComments: false,
      minify: false,
      secureFile: false,
      ...options,
    };

    const jsonString = JSONUtilities.stringify(data, {
      minify: mergedOptions.minify,
      keepComments: mergedOptions.keepComments,
    });

    // Create nested directories if needed
    const dirPath = path.dirname(fileName);
    fs.ensureDirSync(dirPath);

    const writeFileOptions: { encoding: string; mode?: number } = { encoding: 'utf8', mode: options?.mode };
    if (mergedOptions.secureFile) {
      writeFileOptions.mode = 0o600;
    }

    fs.writeFileSync(fileName, jsonString, writeFileOptions);
  };

  public static parse = <T>(
    jsonString: string,
    options?: {
      preserveComments?: boolean;
    },
  ): T => {
    if (jsonString === undefined || (typeof jsonString === 'string' && jsonString.trim().length === 0)) {
      throw new Error("'jsonString' argument missing or empty");
    }

    const mergedOptions = {
      preserveComments: false,
      ...options,
    };

    let data: T;

    // By type definition we don't allow any value other than string, but to preserve JSON.parse behavior,
    // which is against the MDN docs we support handling of non-string types like boolean and number.
    if (typeof jsonString === 'string') {
      let cleanString = jsonString;

      // Strip BOM if input has it
      if (cleanString.charCodeAt(0) === 0xfeff) {
        cleanString = cleanString.slice(1);
      }

      data = hjson.parse(cleanString, {
        keepWsc: mergedOptions.preserveComments,
      });
    } else {
      return (jsonString as unknown) as T;
    }

    return data as T;
  };

  public static stringify = (
    data: any,
    options?: {
      minify?: boolean;
      keepComments?: boolean;
    },
  ): string | undefined => {
    if (!data) {
      throw new Error("'data' argument missing");
    }

    const mergedOptions = {
      minify: false,
      keepComments: false,
      ...options,
    };

    let jsonString = '';

    // For minification use builtin JSON.stringify as hjson has no option for it
    if (mergedOptions.minify) {
      jsonString = JSON.stringify(data);
    } else {
      // Temporarily fallback to builtin stringify until 'undefined' serialization can be solved with hjson
      // This only affects comment roundtripping which we don't use explicitly anywhere yet.
      jsonString = JSON.stringify(data, null, 2);
      // jsonString = hjson.stringify(data, {
      //   bracesSameLine: true,
      //   space: 2,
      //   separator: true,
      //   quotes: 'all',
      //   keepWsc: mergedOptions.keepComments,
      // });
    }

    return jsonString;
  };
}
