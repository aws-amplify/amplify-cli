import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { getDstMap } from '../utils/destFileMapper';

const pathToTemplateFiles = path.join(templateRoot, 'lambda/serverless');

export function provideServerless(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToTemplateFiles);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      parameters: {
        path: '/item',
        expressPath: '/item',
      },
      defaultEditorFile: path.join('src', 'app.js'),
      destMap: getDstMap(files),
    },
  });
}
