import { FunctionTemplateParameters, TemplateContributionRequest } from 'amplify-function-plugin-interface';
import { commonFiles, templateRoot } from '../utils/constants';
import { getDstMap } from '../utils/destFileMapper';
import path from 'path';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function provideHelloWorld(request: TemplateContributionRequest): Promise<FunctionTemplateParameters> {
  const files = [
    ...commonFiles,
    'HelloWorld/aws-lambda-tools-defaults.json.ejs',
    'HelloWorld/Function.csproj.ejs',
    'HelloWorld/FunctionHandler.cs.ejs',
    'HelloWorld/event.json',
  ];
  const handlerSource = path.join('src', `${request.contributionContext.functionName}.cs`);
  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        ...getDstMap(commonFiles),
        'HelloWorld/aws-lambda-tools-defaults.json.ejs': path.join('src', 'aws-lambda-tools-defaults.json'),
        'HelloWorld/Function.csproj.ejs': path.join('src', `${request.contributionContext.functionName}.csproj`),
        'HelloWorld/FunctionHandler.cs.ejs': handlerSource,
        'HelloWorld/event.json': path.join('src', 'event.json'),
      },
    },
  };
}
