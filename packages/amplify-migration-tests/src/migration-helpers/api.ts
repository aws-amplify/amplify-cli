import {
  AddApiOptions,
  defaultOptions,
  getCLIPath,
  getSchemaPath,
  KEY_DOWN_ARROW,
  nspawn as spawn,
  selectRuntime,
  selectTemplate,
} from 'amplify-e2e-core';
import { assign } from 'lodash';

/**
 * Old Dx prior to this api workflow change https://github.com/aws-amplify/amplify-cli/pull/8153
 */
export function addApiWithoutSchemaOldDx(cwd: string, opts: Partial<AddApiOptions> = {}) {
  const options = assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendLine(options.apiName)
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendCarriageReturn()
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendCarriageReturn()
      .wait('Do you have an annotated GraphQL schema?')
      .sendConfirmNo()
      .wait('Choose a schema template:')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
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

export function addApiWithSchemaAndConflictDetectionOldDx(cwd: string, schemaFile: string) {
  const schemaPath = getSchemaPath(schemaFile);
  return new Promise<void>((resolve, reject) => {
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
      .sendConfirmNo()
      .wait(/.*Enable conflict detection.*/)
      .sendConfirmYes()
      .wait(/.*Select the default resolution strategy.*/)
      .sendCarriageReturn()
      .wait(/.*Do you have an annotated GraphQL schema.*/)
      .sendConfirmYes()
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

export function addRestApiOldDx(cwd: string, settings: any) {
  const isFirstRestApi = settings.isFirstRestApi ?? true;
  let chain = spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
    .wait('Select from one of the below mentioned services')
    .sendKeyDown()
    .sendCarriageReturn(); // REST

  if (!isFirstRestApi) {
    chain.wait('Would you like to add a new path to an existing REST API');

    if (settings.path) {
      chain
        .sendYes()
        .wait('Select the REST API you want to update')
        .sendCarriageReturn() // Select the first REST API
        .wait('What would you like to do?')
        .sendCarriageReturn() // Add another path
        .wait('Provide a path')
        .sendLine(settings.path)
        .wait('Choose a lambda source')
        .sendKeyDown()
        .sendCarriageReturn() // Existing lambda
        .wait('Choose the Lambda function to invoke by this path')
        .sendCarriageReturn() // Pick first one
        .wait('Restrict API access')
        .sendConfirmNo() // Do not restrict access
        .wait('Do you want to add another path')
        .sendConfirmNo() // Do not add another path
        .sendEof();

      return chain.runAsync();
    } else {
      chain.sendConfirmNo();
    }
  }

  chain.wait('Provide a friendly name for your resource to be used as a label for this category in the project');
  if (settings.apiName) {
    chain.sendLine(settings.apiName);
  } else {
    chain.sendCarriageReturn();
  }
  chain.wait('Provide a path').sendCarriageReturn().wait('Choose a lambda source');

  if (settings.existingLambda) {
    chain
      .sendKeyDown()
      .sendCarriageReturn() // Existing lambda
      .wait('Choose the Lambda function to invoke by this path'); // Expect only 1 Lambda is present
  } else {
    chain
      .sendCarriageReturn() // Create new Lambda function
      .wait('Provide an AWS Lambda function name')
      .sendCarriageReturn();

    selectRuntime(chain, 'nodejs');

    const templateName = settings.isCrud
      ? 'CRUD function for DynamoDB (Integration with API Gateway)'
      : 'Serverless ExpressJS function (Integration with API Gateway)';
    selectTemplate(chain, templateName, 'nodejs');

    if (settings.isCrud) {
      chain
        .wait('Choose a DynamoDB data source option')
        .sendCarriageReturn() // Use DDB table configured in current project
        .wait('Choose from one of the already configured DynamoDB tables')
        .sendCarriageReturn(); // Use first one in the list
    }

    chain
      .wait('Do you want to configure advanced settings?')
      .sendConfirmNo()
      .wait('Do you want to edit the local lambda function now')
      .sendConfirmNo();
  }

  chain.wait('Restrict API access');
  if (settings.restrictAccess) {
    chain.sendConfirmYes();

    if (settings.hasUserPoolGroups) {
      chain.wait('Restrict access by').sendCarriageReturn(); // Auth/Guest Users
    }

    chain.wait('Who should have access');

    if (settings.allowGuestUsers) {
      chain
        .sendKeyDown()
        .sendCarriageReturn() // Authenticated and Guest users
        .wait('What permissions do you want to grant to Authenticated users')
        .send('a') // CRUD permissions for authenticated users
        .sendCarriageReturn()
        .wait('What permissions do you want to grant to Guest users')
        .send('a') // CRUD permissions for guest users
        .sendCarriageReturn();
    } else {
      chain
        .sendCarriageReturn() // Authenticated users only
        .wait('What permissions do you want to grant to Authenticated users')
        .send('a') // CRUD permissions
        .sendCarriageReturn();
    }
  } else {
    chain.sendConfirmNo(); // Do not restrict access
  }

  chain.wait('Do you want to add another path').sendConfirmNo().sendEof();

  return chain.runAsync();
}
