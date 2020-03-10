import { FunctionParameters } from "amplify-function-plugin-interface";
import {TEMPLATE_ROOT} from '../utils/constants';
import path from 'path';
import fs from 'fs-extra';
import { askDynamoDBQuestions, getTableParameters } from "../utils/dynamoDBWalkthrough";

const PATH_TO_TEMPLATE_FILES = path.join(TEMPLATE_ROOT, 'lambda/crud')

// copied from legacy lambda-walkthrough with slight modifications for typescript and refactored FunctionParameters object
export async function provideCrud(context: any, params: FunctionParameters): Promise<FunctionParameters> {
  const dynamoResource = await askDynamoDBQuestions(context);

  const tableParameters = await getTableParameters(context, dynamoResource);
  Object.assign(dynamoResource, { category: 'storage' }, { tableDefinition: { ...tableParameters } });

  return {
    functionTemplate: {
      sourceRoot: PATH_TO_TEMPLATE_FILES,
      sourceFiles: fs.readdirSync(PATH_TO_TEMPLATE_FILES),
      parameters: {
        path: '/item', // this is the default. If a different value is already specified, this will not overwrite it
        database: dynamoResource,
      },
      defaultEditorFile: 'app.js',
    },
    dependsOn: [
      {
        category: 'storage',
        resourceName: dynamoResource.resourceName,
        attributes: ['Name', 'Arn'],
        attributeEnvMap: {Name: 'TABLE_NAME', Arn: 'TABLE_ARN'},
      }
    ]
  }
}