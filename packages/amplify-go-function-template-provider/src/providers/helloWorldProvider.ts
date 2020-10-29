import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import fs from 'fs-extra';
import path from 'path';
import { getDstMap } from '../utils/destFileMapper';

const pathToTemplateFiles = path.join(templateRoot, 'hello-world');

export function provideHelloWorld(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToTemplateFiles);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: path.join('src', 'main.go'),
      destMap: getDstMap(files),
    },
  });
}
