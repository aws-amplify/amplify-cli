import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';

const pathToTemplateFiles = path.join(templateRoot, 'hello-world');

export const provideHelloWorld = async (): Promise<FunctionTemplateParameters> => {
  const files = ['Package.swift.ejs', 'main.swift'];
  const handlerSource = path.join('Sources', 'example', 'main.swift');

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        'Package.swift.ejs': path.join('Package.swift'),
        'main.swift': path.join('Sources', 'example', 'main.swift'),
      },
    },
  };
};
