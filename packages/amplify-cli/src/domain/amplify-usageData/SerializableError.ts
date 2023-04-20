import { $TSAny } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';

const stackTraceRegex = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
const ARNRegex =
  /arn:[a-z0-9][-.a-z0-9]{0,62}:[A-Za-z0-9][A-Za-z0-9_/.-]{0,62}:[A-Za-z0-9_/.-]{0,63}:[A-Za-z0-9_/.-]{0,63}:[A-Za-z0-9][A-Za-z0-9:_/+=,@.-]{0,1023}/g;

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
    this.message = removeARN(error.message)!;
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
  const directoriesRemoved = new Set<string>();
  directoriesToRemove.forEach((directory) => {
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

  return result.map((r) => {
    if (r === longestString) {
      return longestString.replace(path.join(...directoriesRemoved), '');
    }
    return r;
  });
};

const removeARN = (str?: string): string | undefined => {
  return str?.replace(ARNRegex, '<escaped ARN>');
};

type Trace = {
  methodName: string;
  file: string;
  lineNumber: string;
  columnNumber: string;
};
