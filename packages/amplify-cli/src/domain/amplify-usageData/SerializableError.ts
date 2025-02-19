import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { homedir } from 'os';
import * as path from 'path';

const stackTraceRegex = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
const ARNRegex =
  /arn:[a-z0-9][-.a-z0-9]{0,62}:[A-Za-z0-9][A-Za-z0-9_/.-]{0,62}:[A-Za-z0-9_/.-]{0,63}:[A-Za-z0-9_/.-]{0,63}:[A-Za-z0-9][A-Za-z0-9:_/+=,@.-]{0,1023}/g;

// Gen1 stacks have same structure as Gen2 stacks
const stackRegex = /amplify-[a-zA-Z0-9-]+/g;
// (file:/+)? -> matches optional file url prefix
// homedir() -> users home directory, replacing \ with /
// [\\w.\\-_@\\\\/]+ -> matches nested directories and file name
const filePathRegex = new RegExp(`(file:/+)?${homedir().replaceAll('\\', '/')}[\\w.\\-_@\\\\/]+`, 'g');

/**
 * Wrapper around Error.name
 */
export class SerializableError {
  name: string;
  message: string;
  details?: string;
  code?: string;
  trace?: Trace[];
  constructor(error: Error) {
    this.name = error.name;
    this.message = anonymizePaths(sanitize(error.message)!);
    this.details = removeARN((error as $TSAny)?.details);
    this.code = (error as $TSAny)?.code;
    this.trace = extractStackTrace(error);
  }
}

const extractStackTrace = (error: Error): Trace[] => {
  const result: Trace[] = [];
  if (error.stack) {
    const stack = error.stack.split('\n');
    stack.forEach((line) => {
      const match = stackTraceRegex.exec(line);
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
    const processedPaths = processPaths(result.map((trace) => trace.file));
    result.forEach((trace, index) => {
      // eslint-disable-next-line no-param-reassign
      trace.file = processedPaths[index];
    });
  }
  return result;
};

const processPaths = (paths: string[]): string[] => {
  const result = [...paths];
  if (paths.length === 0) {
    return result;
  }
  const longestString = paths.reduce((a, b) => (a.length > b.length ? a : b));
  const directoriesToRemove = longestString.split('/');
  const directoriesRemoved: Array<string> = [];
  for (const directory of directoriesToRemove) {
    if (directory === '') {
      continue;
    }
    let removedInAnyPath = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i].startsWith(`/${directory}`) && result[i] !== longestString) {
        result[i] = result[i].replace(`/${directory}`, '');
        removedInAnyPath = true;
      }
    }
    if (removedInAnyPath) {
      directoriesRemoved.push(directory);
    } else {
      // if current segment is not in any path this means we removed common prefix from all paths.
      break;
    }
  }

  return result.map((r) => {
    if (r === longestString && directoriesRemoved.length > 0) {
      return longestString.replace(path.join(...directoriesRemoved), '');
    }
    return r;
  });
};

const sanitize = (str?: string): string | undefined => {
  let result = str;
  result = removeARN(result);
  result = removeStackIdentifier(result);

  return result;
};

const removeARN = (str?: string): string | undefined => {
  return str?.replace(ARNRegex, '<escaped ARN>');
};

const removeStackIdentifier = (str?: string): string | undefined => {
  return str?.replace(stackRegex, '<escaped stack>') ?? '';
};

const anonymizePaths = (str: string): string => {
  const result = str;
  const matches = [...result.matchAll(filePathRegex)];

  for (const match of matches) {
    result.replace(match[0], processPaths([match[0]])[0]);
  }

  return result;
};

type Trace = {
  methodName: string;
  file: string;
  lineNumber: string;
  columnNumber: string;
};
