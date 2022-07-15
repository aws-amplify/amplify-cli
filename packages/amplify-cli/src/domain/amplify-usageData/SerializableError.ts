import * as path from 'path';

const regex = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;

/**
 * Wrapper around Error.name
 */
export class SerializableError {
  name: string;
  trace?: Trace[];
  constructor(error: Error) {
    this.name = error.name;
    this.trace = this.extractStackTrace(error);
  }

  private extractStackTrace(error: Error): Trace[] {
    const result: Trace[] = [];
    if (error.stack) {
      const stack = error.stack.split('\n');
      stack.forEach(line => {
        const match = regex.exec(line);
        if (match) {
          const [, methodName, file, lineNumber, columnNumber] = match;
          result.push({
            methodName,
            file,
            lineNumber,
            columnNumber,
          });
        }
      });
      const processedPaths = this.processPaths(result.map(trace => trace.file));
      result.forEach((trace, index) => {
        trace.file = processedPaths[index];
      });
    }
    return result;
  }

  private processPaths(paths: string[]): string[] {
    const result = [...paths];
    if (paths.length === 0) {
      return result;
    }
    const longestString = paths.reduce((a, b) => (a.length > b.length ? a : b));
    const directoriesToRemove = longestString.split('/');
    const directoriesRemoved = new Set<string>();
    directoriesToRemove.forEach(directory => {
      if (directory === '') {
        return;
      }
      for (let i = 0; i < result.length; i++) {
        if (result[i].startsWith(`/${directory}`) && result[i] !== longestString) {
          result[i] = result[i].replace(`/${directory}`, '');
          directoriesRemoved.add(directory);
        }
      }
    });

    return result.map(r => {
      if (r === longestString) {
        return longestString.replace(path.join(...directoriesRemoved), '');
      }
      return r;
    });
  }
}

type Trace = {
  methodName: string;
  file: string;
  lineNumber: string;
  columnNumber: string;
}
