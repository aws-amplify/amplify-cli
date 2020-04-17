import { nspawn as spawn, ExecutionContext, KEY_DOWN_ARROW } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import { getCLIPath, updateSchema } from '../utils';
import { nodeJSTemplateChoices, selectRuntime } from './function';
import { singleSelect } from '../utils/selectors';

function getSchemaPath(schemaName: string): string {
  return `${__dirname}/../../schemas/${schemaName}`;
}

export function addApiWithoutSchema(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendCarriageReturn()
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendCarriageReturn()
      .wait('Do you have an annotated GraphQL schema?')
      .sendLine('n')
      .wait('Do you want a guided schema creation')
      .sendLine('y')
      .wait('What best describes your project')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendLine('n')
      .wait(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addApiWithSchema(cwd: string, schemaFile: string) {
  const schemaPath = getSchemaPath(schemaFile);
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendCarriageReturn()
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendCarriageReturn()
      .wait('Do you have an annotated GraphQL schema?')
      .sendLine('y')
      .wait('Provide your schema file path:')
      .sendLine(schemaPath)
      .wait(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addApiWithSchemaAndConflictDetection(cwd: string, schemaFile: string) {
  const schemaPath = getSchemaPath(schemaFile);
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendCarriageReturn()
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendLine(KEY_DOWN_ARROW) // Down
      .wait(/.*Configure additional auth types.*/)
      .sendLine('n')
      .wait(/.*Configure conflict detection.*/)
      .sendLine('y')
      .wait(/.*Select the default resolution strategy.*/)
      .sendCarriageReturn()
      .wait(/.*Do you have an annotated GraphQL schema.*/)
      .sendLine('y')
      .wait('Provide your schema file path:')
      .sendLine(schemaPath)
      .wait(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function updateApiSchema(cwd: string, projectName: string, schemaName: string) {
  const testSchemaPath = getSchemaPath(schemaName);
  const schemaText = fs.readFileSync(testSchemaPath).toString();
  updateSchema(cwd, projectName, schemaText);
}

export function updateApiWithMultiAuth(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Select from the options below')
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendLine('description')
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendLine('300')
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendLine(KEY_DOWN_ARROW) // Down
      .wait(/.*Configure additional auth types.*/)
      .sendLine('y')
      .wait(/.*Choose the additional authorization types you want to configure for the API.*/)
      .sendLine('a\r') // All items
      // Cognito
      .wait(/.*Do you want to use the default authentication and security configuration.*/)
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in?')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendCarriageReturn()
      // OIDC
      .wait(/.*Enter a name for the OpenID Connect provider:.*/)
      .sendLine('myoidcprovider')
      .wait(/.*Enter the OpenID Connect provider domain \(Issuer URL\).*/)
      .sendLine('https://facebook.com/')
      .wait(/.*Enter the Client Id from your OpenID Client Connect application.*/)
      .sendLine('clientId')
      .wait(/.*Enter the number of milliseconds a token is valid after being issued to a user.*/)
      .sendLine('1000')
      .wait(/.*Enter the number of milliseconds a token is valid after being authenticated.*/)
      .sendLine('2000')
      .wait('Configure conflict detection?')
      .sendLine('n')
      .wait(/.*Successfully updated resource.*/)
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function updateAPIWithResolutionStrategy(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Select from the options below')
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendCarriageReturn()
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendLine(KEY_DOWN_ARROW) // Down
      .wait(/.*Configure additional auth types.*/)
      .sendLine('n')
      .wait(/.*Configure conflict detection.*/)
      .sendLine('y')
      .wait(/.*Select the default resolution strategy.*/)
      .sendLine(KEY_DOWN_ARROW) // Down
      .wait(/.*Do you want to override default per model settings.*/)
      .sendLine('n')
      .wait(/.*Successfully updated resource.*/)
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// Either settings.existingLambda or settings.isCrud is required
export function addRestApi(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    if (!('existingLambda' in settings) && !('isCrud' in settings)) {
      reject('Missing property in settings object in addRestApi()');
    } else {
      let chain = spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
        .wait('Please select from one of the below mentioned services')
        .send(KEY_DOWN_ARROW)
        .sendCarriageReturn() // REST
        .wait('Provide a friendly name for your resource to be used as a label for this category in the project')
        .sendCarriageReturn()
        .wait('Provide a path')
        .sendCarriageReturn()
        .wait('Choose a lambda source');

      if (settings.existingLambda) {
        chain
          .send(KEY_DOWN_ARROW)
          .sendCarriageReturn() // Existing lambda
          .wait('Choose the Lambda function to invoke by this path')
          .sendCarriageReturn(); // Pick first one
      } else {
        chain
          .sendCarriageReturn() // Create new Lambda function
          .wait('Provide a friendly name for your resource to be used as a label for this category in the project')
          .sendCarriageReturn()
          .wait('Provide the AWS Lambda function name')
          .sendCarriageReturn();

        selectRuntime(chain, 'nodejs');

        const templateName = settings.isCrud
          ? 'CRUD function for DynamoDB (Integration with API Gateway)'
          : 'Serverless ExpressJS function (Integration with API Gateway)';
        singleSelect(chain.wait('Choose the function template that you want to use'), templateName, nodeJSTemplateChoices);

        if (settings.isCrud) {
          chain
            .wait('Choose a DynamoDB data source option')
            .sendCarriageReturn() // Use DDB table configured in current project
            .wait('Choose from one of the already configured DynamoDB tables')
            .sendCarriageReturn(); // Use first one in the list
        }

        chain
          .wait('Do you want to access other resources created in this project from your Lambda function')
          .sendLine('n')
          .wait('Do you want to invoke this function on a recurring schedule?')
          .sendLine('n')
          .wait('Do you want to edit the local lambda function now')
          .sendLine('n');
      }

      chain
        .wait('Restrict API access')
        .sendLine('n')
        .wait('Do you want to add another path')
        .sendLine('n')
        .sendEof()
        .run((err: Error) => {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        });
    }
  });
}
