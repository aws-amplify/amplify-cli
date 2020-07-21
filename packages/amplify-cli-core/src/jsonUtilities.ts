import * as fs from 'fs-extra';
import * as path from 'path';
import * as hjson from 'hjson';

export class JSONUtilities {
  public static readJson = async <T>(
    fileName: string,
    options: {
      throwIfNotExist?: boolean;
      preserveComments?: boolean;
    } = {
      throwIfNotExist: true,
      preserveComments: false,
    },
  ): Promise<T> => {
    if (!fileName) {
      throw new Error(`'fileName' argument missing`);
    }

    if (!fs.existsSync(fileName)) {
      if (options.throwIfNotExist === true) {
        throw new Error(`File at path: '${fileName}' does not exist`);
      } else {
        return (undefined as unknown) as T;
      }
    }

    const content = await fs.readFile(fileName, 'utf8');

    const data = JSONUtilities.parse<T>(content, {
      preserveComments: options.preserveComments,
    });

    return data as T;
  };

  public static writeJson = async (
    fileName: string,
    data: any,
    options: {
      minify?: boolean;
      keepComments?: boolean;
    } = {
      minify: false,
      keepComments: false,
    },
  ): Promise<void> => {
    if (!fileName) {
      throw new Error(`'fileName' argument missing`);
    }

    if (!data) {
      throw new Error(`'data' argument missing`);
    }

    const jsonString = JSONUtilities.stringify(data, {
      minify: options.minify,
      keepComments: options.keepComments,
    });

    // Create nested directories if needed
    const dirPath = path.dirname(fileName);
    if (!(await fs.pathExists(dirPath))) {
      await fs.mkdirs(dirPath);
    }

    await fs.writeFile(fileName, jsonString, 'utf8');
  };

  public static parse = <T>(
    jsonString: string,
    options: {
      preserveComments?: boolean;
    } = {
      preserveComments: false,
    },
  ): T => {
    if (!jsonString || jsonString.trim().length === 0) {
      throw new Error("'jsonString' argument missing");
    }

    let cleanString = jsonString;

    // Strip BOM if input has it
    if (cleanString.charCodeAt(0) === 0xfeff) {
      cleanString = cleanString.slice(1);
    }

    const data = hjson.parse(cleanString, {
      keepWsc: options.preserveComments,
    });

    return data as T;
  };

  public static stringify = (
    data: any,
    options: {
      minify?: boolean;
      keepComments?: boolean;
    } = {
      minify: false,
      keepComments: false,
    },
  ): string | undefined => {
    if (!data) {
      throw new Error("'data' argument missing");
    }

    let jsonString = '';

    // For minification use builtin JSON.stringify as hjson has no option for it
    if (options.minify === true) {
      jsonString = JSON.stringify(data);
    } else {
      jsonString = hjson.stringify(data, {
        space: 2,
        separator: true,
        quotes: 'all',
        keepWsc: options.keepComments,
      });
    }

    return jsonString;
  };
}
