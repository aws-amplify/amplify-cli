import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';
import fs from 'fs-extra';
import { askDynamoDBQuestions, getTableParameters } from '../utils/dynamoDBWalkthrough';
import _ from 'lodash';
import { getDstMap } from '../utils/destFileMapper';

const pathToTemplateFiles = path.join(templateRoot, 'lambda/crud');

// copied from legacy lambda-walkthrough with slight modifications for typescript and refactored FunctionParameters object
export async function provideCrud(context: any): Promise<FunctionTemplateParameters> {
  const dynamoResource = await askDynamoDBQuestions(context);

  const tableParameters = await getTableParameters(context, dynamoResource);
  Object.assign(dynamoResource, { category: 'storage' }, { tableDefinition: { ...tableParameters } });
  const files = fs.readdirSync(pathToTemplateFiles);
  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      parameters: {
        path: '/item', // this is the default. If a different value is already specified, this will not overwrite it
        expressPath: '/item',
        database: dynamoResource,
      },
      defaultEditorFile: path.join('src', 'app.js'),
      destMap: getDstMap(files),
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
