import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { getDstMap } from '../utils/destFileMapper';

const pathToTemplateFiles = path.join(templateRoot, 'lambda/hello-world');

export function provideHelloWorld(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToTemplateFiles);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: path.join('src', 'index.js'),
      destMap: getDstMap(files),
    },
  });
}
