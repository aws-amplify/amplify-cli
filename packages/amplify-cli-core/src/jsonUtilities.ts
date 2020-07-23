import * as fs from 'fs-extra';
import * as path from 'path';
import * as hjson from 'hjson';

export class JSONUtilities {
  public static readJson = async <T>(
    fileName: string,
    options?: {
      throwIfNotExist?: boolean;
      preserveComments?: boolean;
    },
  ): Promise<T | undefined> => {
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

    const content = await fs.readFile(fileName, 'utf8');

    const data = JSONUtilities.parse<T>(content, {
      preserveComments: mergedOptions.preserveComments,
    });

    return data as T;
  };

  public static writeJson = async (
    fileName: string,
    data: any,
    options?: {
      minify?: boolean;
      keepComments?: boolean;
    },
  ): Promise<void> => {
    if (!fileName) {
      throw new Error(`'fileName' argument missing`);
    }

    if (!data) {
      throw new Error(`'data' argument missing`);
    }

    const mergedOptions = {
      minify: false,
      keepComments: false,
      ...options,
    };

    const jsonString = JSONUtilities.stringify(data, {
      minify: mergedOptions.minify,
      keepComments: mergedOptions.keepComments,
    });

    // Create nested directories if needed
    const dirPath = path.dirname(fileName);
    await fs.ensureDir(dirPath);

    await fs.writeFile(fileName, jsonString, 'utf8');
  };

  public static parse = <T>(
    jsonString: string,
    options?: {
      preserveComments?: boolean;
    },
  ): T => {
    if (!jsonString || jsonString.trim().length === 0) {
      throw new Error("'jsonString' argument missing");
    }

    const mergedOptions = {
      preserveComments: false,
      ...options,
    };

    let cleanString = jsonString;

    // Strip BOM if input has it
    if (cleanString.charCodeAt(0) === 0xfeff) {
      cleanString = cleanString.slice(1);
    }

    const data = hjson.parse(cleanString, {
      keepWsc: mergedOptions.preserveComments,
    });

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
      jsonString = hjson.stringify(data, {
        space: 2,
        separator: true,
        quotes: 'all',
        keepWsc: mergedOptions.keepComments,
      });
    }

    return jsonString;
  };
}
