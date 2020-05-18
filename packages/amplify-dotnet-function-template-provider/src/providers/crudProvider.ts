import { FunctionTemplateParameters, TemplateContributionRequest } from 'amplify-function-plugin-interface';
import { commonFiles, templateRoot } from '../utils/constants';
import { getDstMap } from '../utils/destFileMapper';
import path from 'path';
import { askDynamoDBQuestions, getTableParameters } from '../utils/dynamoDBWalkthrough';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

// copied from legacy lambda-walkthrough with slight modifications for typescript and refactored FunctionParameters object
export async function provideCrud(request: TemplateContributionRequest, context: any): Promise<FunctionTemplateParameters> {
  const dynamoResource = await askDynamoDBQuestions(context);

  const tableParameters = await getTableParameters(context, dynamoResource);
  Object.assign(dynamoResource, { category: 'storage' }, { tableDefinition: { ...tableParameters } });
  const files = [
    ...commonFiles,
    'Crud/aws-lambda-tools-defaults.json.ejs',
    'Crud/Function.csproj.ejs',
    'Crud/FunctionHandler.cs.ejs',
    'Crud/event.json.ejs',
  ];
  const handlerSource = path.join('src', `${request.contributionContext.functionName}.cs`);

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      parameters: {
        path: '/items', // this is the default. If a different value is already specified, this will not overwrite it
        expressPath: '/items',
        database: dynamoResource,
      },
      defaultEditorFile: handlerSource,
      destMap: {
        ...getDstMap(commonFiles),
        'Crud/aws-lambda-tools-defaults.json.ejs': path.join('src', 'aws-lambda-tools-defaults.json'),
        'Crud/Function.csproj.ejs': path.join('src', `${request.contributionContext.functionName}.csproj`),
        'Crud/FunctionHandler.cs.ejs': handlerSource,
        'Crud/event.json.ejs': path.join('src', 'event.json'),
      },
    },
    dependsOn: [
      {
        category: 'storage',
        resourceName: dynamoResource.resourceName,
        attributes: ['Name', 'Arn'],
        attributeEnvMap: { Name: 'TABLE_NAME', Arn: 'TABLE_ARN' },
      },
    ],
  };
}
