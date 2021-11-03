import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { ExecutionContext, getCLIPath, nspawn as spawn, RETURN, updateSchema } from '..';
import { multiSelect, singleSelect } from '../utils/selectors';
import { selectRuntime, selectTemplate } from './lambda-function';
import { modifiedApi } from './resources/modified-api-index';

export function getSchemaPath(schemaName: string): string {
  return path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'schemas', schemaName);
}

export function apiGqlCompile(cwd: string, testingWithLatestCodebase: boolean = false) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['api', 'gql-compile'], { cwd, stripColors: true })
      .wait('GraphQL schema compiled successfully.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

interface AddApiOptions {
  apiName: string;
  testingWithLatestCodebase: boolean;
}

const defaultOptions: AddApiOptions = {
  apiName: '\r',
  testingWithLatestCodebase: false,
};

export function addApiWithoutSchema(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendKeyUp(3)
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendLine(options.apiName)
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
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

export function addApiWithOneModel(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      )
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

export function addApiWithThreeModels(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendKeyDown(1)
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      )
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

export function addApiWithBlankSchema(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendKeyUp(3)
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendLine(options.apiName)
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendLine('n')
      .wait(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      )
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

export function addApiWithBlankSchemaAndConflictDetection(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(defaultOptions.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendKeyUp()
      .sendCarriageReturn()
      .wait(/.*Enable conflict detection.*/)
      .sendConfirmYes()
      .wait(/.*Select the default resolution strategy.*/)
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendKeyDown(2)
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

/**
 * Note: Lambda Authorizer is enabled only for Transformer V2
 */
export function addApiWithAllAuthModesV2(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendKeyUp(3)
      .sendCarriageReturn()
      .wait('Provide API name:')
      .sendLine(options.apiName)
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendKeyUp(2)
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      // API Key
      .wait(/.*Enter a description for the API key.*/)
      .sendLine('description')
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendLine('300')
      .wait(/.*Configure additional auth types.*/)
      .sendConfirmYes()
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
      // Lambda
      .wait(/.*Choose a Lambda authorization function*/)
      .sendCarriageReturn()
      .wait(/.*How long should the authorization response be cached in seconds.*/)
      .sendLine('600')
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      // Schema selection
      .wait('Choose a schema template:')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function updateApiSchema(cwd: string, projectName: string, schemaName: string, forceUpdate: boolean = false) {
  const testSchemaPath = getSchemaPath(schemaName);
  let schemaText = fs.readFileSync(testSchemaPath).toString();
  if (forceUpdate) {
    schemaText += '  ';
  }
  updateSchema(cwd, projectName, schemaText);
}

export function updateApiWithMultiAuth(cwd: string, settings: any) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Select a setting to edit.*/)
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendCarriageReturn()
      .wait(/.*Enter a description for the API key.*/)
      .sendLine('description')
      .wait(/.*After how many days from now the API key should expire.*/)
      .sendLine('300')
      .wait(/.*Configure additional auth types.*/)
      .sendConfirmYes()
      .wait(/.*Choose the additional authorization types you want to configure for the API.*/)
      .sendLine('a') // All items
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

export function apiEnableDataStore(cwd: string, settings: any) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Select a setting to edit.*/)
      .sendKeyDown()
      .sendCarriageReturn()
      .wait(/.*Select the default resolution strategy.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to override default per model settings?.*/)
      .sendConfirmNo()
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

export function apiDisableDataStore(cwd: string, settings: any) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Select a setting to edit.*/)
      .sendKeyDown(2) // Disable conflict detection
      .sendCarriageReturn()
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

export function updateAPIWithResolutionStrategyWithoutModels(cwd: string, settings: any) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Select a setting to edit.*/)
      .sendKeyDown()
      .sendCarriageReturn()
      .wait(/.*Select the default resolution strategy.*/)
      .sendKeyDown()
      .sendCarriageReturn()
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

export function updateAPIWithResolutionStrategyWithModels(cwd: string, settings: any) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Select a setting to edit.*/)
      .sendKeyDown()
      .sendCarriageReturn()
      .wait(/.*Select the default resolution strategy.*/)
      .sendKeyDown()
      .sendCarriageReturn()
      .wait(/.*Do you want to override default per model settings?.*/)
      .sendConfirmNo()
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

type RestApiSettings = {
  allowGuestUsers?: boolean;
  existingLambda?: boolean;
  isFirstRestApi?: boolean;
  isCrud?: boolean;
  path?: string;
  resourceName?: string;
  restrictAccess?: boolean;
};

export function addRestApi(cwd: string, settings: RestApiSettings) {
  return new Promise<void>((resolve, reject) => {
    const isFirstRestApi = settings.isFirstRestApi ?? true;
    const chain = spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
      .sendCarriageReturn(); // REST

    if (!isFirstRestApi) {
      chain.wait('Would you like to add a new path to an existing REST API');

      if (settings.path) {
        chain
          .sendConfirmYes()
          .wait('Select the REST API you would want to update')
          .sendCarriageReturn() // Select the first REST API
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
          .sendEof()
          .run((err: Error) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        return;
      } else {
        chain.sendConfirmNo();
      }
    }

    chain
      .wait('Provide a friendly name for your resource to be used as a label for this category in the project')
      .sendLine(settings.resourceName ?? RETURN)
      .wait('Provide a path')
      .sendCarriageReturn()
      .wait('Choose a lambda source');

    if (settings.existingLambda) {
      chain
        .sendKeyDown()
        .sendCarriageReturn() // Existing lambda
        .wait('Choose the Lambda function to invoke by this path')
        .sendCarriageReturn(); // Pick first one
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
      chain.sendConfirmYes().wait('Who should have access');

      if (!settings.allowGuestUsers) {
        chain
          .sendCarriageReturn() // Authenticated users only
          .wait('What kind of access do you want for Authenticated users')
          .sendLine('a'); // CRUD permissions
      } else {
        chain
          .sendKeyDown()
          .sendCarriageReturn() // Authenticated and Guest users
          .wait('What kind of access do you want for Authenticated users')
          .sendLine('a') // CRUD permissions for authenticated users
          .wait('What kind of access do you want for Guest users')
          .sendKeyDown()
          .send(' '); // R permissions for guest users
      }
    } else {
      chain.sendConfirmNo(); // Do not restrict access
    }

    chain
      .wait('Do you want to add another path')
      .sendConfirmNo()
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

const allAuthTypes = ['API key', 'Amazon Cognito User Pool', 'IAM', 'OpenID Connect'];

export function addApi(projectDir: string, settings?: any) {
  let authTypesToSelectFrom = allAuthTypes.slice();
  return new Promise<void>((resolve, reject) => {
    let chain = spawn(getCLIPath(defaultOptions.testingWithLatestCodebase), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn();

    if (settings && Object.keys(settings).length > 0) {
      const authTypesToAdd = Object.keys(settings);
      const defaultType = authTypesToAdd[0];

      chain
        .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
        .sendKeyUp(2)
        .sendCarriageReturn();

      singleSelect(chain.wait('Choose the default authorization type for the API'), defaultType, authTypesToSelectFrom);
      setupAuthType(defaultType, chain, settings);

      if (authTypesToAdd.length > 1) {
        authTypesToAdd.shift();

        chain.wait('Configure additional auth types?').sendConfirmYes();

        authTypesToSelectFrom = authTypesToSelectFrom.filter(x => x !== defaultType);

        multiSelect(
          chain.wait('Choose the additional authorization types you want to configure for the API'),
          authTypesToAdd,
          authTypesToSelectFrom,
        );

        authTypesToAdd.forEach(authType => {
          setupAuthType(authType, chain, settings);
        });
      } else {
        chain.wait('Configure additional auth types?').sendLine('n');
      }
    }

    chain
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function setupAuthType(authType: string, chain: ExecutionContext, settings?: any) {
  switch (authType) {
    case 'API key':
      setupAPIKey(chain);
      break;
    case 'Amazon Cognito User Pool':
      setupCognitoUserPool(chain);
      break;
    case 'IAM':
      setupIAM(chain);
      break;
    case 'OpenID Connect':
      setupOIDC(chain, settings);
      break;
  }
}

function setupAPIKey(chain: ExecutionContext) {
  chain
    .wait('Enter a description for the API key')
    .sendCarriageReturn()
    .wait('After how many days from now the API key should expire')
    .sendCarriageReturn();
}

function setupCognitoUserPool(chain: ExecutionContext) {
  chain
    .wait('Do you want to use the default authentication and security configuration')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .sendCarriageReturn();
}

function setupIAM(chain: any) {
  //no need to do anything
}

function setupOIDC(chain: ExecutionContext, settings?: any) {
  if (!settings || !settings['OpenID Connect']) {
    throw new Error('Must provide OIDC auth settings.');
  }
  chain
    .wait('Enter a name for the OpenID Connect provider')
    .send(settings['OpenID Connect'].oidcProviderName)
    .sendCarriageReturn()
    .wait('Enter the OpenID Connect provider domain')
    .send(settings['OpenID Connect'].oidcProviderDomain)
    .sendCarriageReturn()
    .wait('Enter the Client Id from your OpenID Client Connect application (optional)')
    .send(settings['OpenID Connect'].oidcClientId)
    .sendCarriageReturn()
    .wait('Enter the number of milliseconds a token is valid after being issued to a user')
    .send(settings['OpenID Connect'].ttlaIssueInMillisecond)
    .sendCarriageReturn()
    .wait('Enter the number of milliseconds a token is valid after being authenticated')
    .send(settings['OpenID Connect'].ttlaAuthInMillisecond)
    .sendCarriageReturn();
}

export function addApiWithCognitoUserPoolAuthTypeWhenAuthExists(projectDir: string) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(defaultOptions.testingWithLatestCodebase), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendKeyUp(2)
      .sendCarriageReturn()
      .wait(/.*Choose the default authorization type for the API.*/)
      .sendKeyDown(1)
      .sendCarriageReturn()
      .wait(/.*Configure additional auth types.*/)
      .sendLine('n')
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addRestContainerApi(projectDir: string) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Which service would you like to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource to be used as a label for this category in the project:')
      .sendCarriageReturn()
      .wait('What image would you like to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('When do you want to build & deploy the Fargate task')
      .sendCarriageReturn()
      .wait('Do you want to restrict API access')
      .sendConfirmNo()
      .wait('Select which container is the entrypoint')
      .sendCarriageReturn()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function rebuildApi(projDir: string, apiName: string) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['rebuild', 'api'], { cwd: projDir, stripColors: true })
      .wait('Type the name of the API to confirm you want to continue')
      .sendLine(apiName)
      .wait('All resources are updated in the cloud')
      .run(err => (err ? reject(err) : resolve()));
  });
}

export function addRestContainerApiForCustomPolicies(projectDir: string, settings: { name: string }) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Which service would you like to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource to be used as a label for this category in the project:')
      .send(settings.name)
      .sendCarriageReturn()
      .wait('What image would you like to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('When do you want to build & deploy the Fargate task')
      .sendCarriageReturn()
      .wait('Do you want to restrict API access')
      .sendConfirmNo()
      .wait('Select which container is the entrypoint')
      .sendCarriageReturn()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => (err ? reject(err) : resolve()));
  });
}

export function modifyRestAPI(projectDir: string, apiName: string) {
  const indexFilePath = path.join(projectDir, 'amplify', 'backend', 'api', apiName, 'src', 'express', 'index.js');
  fs.writeFileSync(indexFilePath, modifiedApi);
}
