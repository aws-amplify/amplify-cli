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
    'InvocationShim/build.gradle.ejs',
    'InvocationShim/MockContext.java.ejs',
    'InvocationShim/MockLogger.java.ejs',
    'InvocationShim/Program.java.ejs',
  ];
  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: path.join('src', 'main', 'java', 'HelloPojo.java'),
      destMap: {
        'hello-world/build.gradle.ejs': path.join('build.gradle'),
        'hello-world/event.json': path.join('src', 'main', 'java', 'event.json'),
        'hello-world/HelloPojo.java.ejs': path.join('src', 'main', 'java', 'HelloPojo.java'),
        'hello-world/RequestClass.java.ejs': path.join('src', 'main', 'java', 'RequestClass.java'),
        'hello-world/ResponseClass.java.ejs': path.join('src', 'main', 'java', 'ResponseClass.java'),
        'InvocationShim/build.gradle.ejs': path.join('src', 'InvocationShim', 'build.gradle'),
        'InvocationShim/MockContext.java.ejs': path.join('src', 'InvocationShim', 'src', 'main', 'java', 'MockContext.java'),
        'InvocationShim/MockLogger.java.ejs': path.join('src', 'InvocationShim', 'src', 'main', 'java', 'MockLogger.java'),
        'InvocationShim/Program.java.ejs': path.join('src', 'InvocationShim', 'src', 'main', 'java', 'Program.java'),
      },
    },
  };
}
