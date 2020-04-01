import { FunctionTemplateParameters, ContributionRequest } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function provideHelloWorld(request: ContributionRequest): Promise<FunctionTemplateParameters> {
  const files = [
    'hello-world/build.gradle.ejs',
    'hello-world/HelloPojo.java.ejs',
    'hello-world/RequestClass.java.ejs',
    'hello-world/ResponseClass.java.ejs',
    'hello-world/event.json',
  ];
  const handlerSource = path.join('src', 'main', 'java','example' ,'HelloPojo.java');

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        'hello-world/build.gradle.ejs': path.join('build.gradle'),
        'hello-world/event.json': path.join('src','event.json'),
        'hello-world/HelloPojo.java.ejs': path.join('src', 'main', 'java','example' ,'HelloPojo.java'),
        'hello-world/RequestClass.java.ejs': path.join('src', 'main', 'java','example' , 'RequestClass.java'),
        'hello-world/ResponseClass.java.ejs': path.join('src', 'main', 'java','example' , 'ResponseClass.java'),
      },
    },
  };
}
