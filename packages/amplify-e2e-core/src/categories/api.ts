/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import {
  addFeatureFlag,
  checkIfBucketExists,
  ExecutionContext,
  getCLIPath,
  getProjectMeta,
  nspawn as spawn,
  setTransformerVersionFlag,
  updateSchema,
} from '..';
import { multiSelect, singleSelect } from '../utils/selectors';
import { selectRuntime, selectTemplate } from './lambda-function';
import { modifiedApi } from './resources/modified-api-index';

const isWindowsPlatform = (): boolean => !!process?.platform?.startsWith('win');

export function getSchemaPath(schemaName: string): string {
  // This condition is to account for a difference in the use of __dirname and paths in CodeBuild Windows jobs
  if (process.env.CODEBUILD_SRC_DIR && isWindowsPlatform()) {
    return path.join(process.env.CODEBUILD_SRC_DIR, 'packages', 'amplify-e2e-tests', 'schemas', schemaName);
  }
  return path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'schemas', schemaName);
}

export function apiGqlCompile(cwd: string, testingWithLatestCodebase = false) {
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

export interface AddApiOptions {
  apiName: string;
  testingWithLatestCodebase: boolean;
  transformerVersion: number;
}

export const defaultOptions: AddApiOptions = {
  apiName: '\r',
  testingWithLatestCodebase: false,
  transformerVersion: 2,
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
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });

    setTransformerVersionFlag(cwd, options.transformerVersion);
  });
}

export function addApiWithOneModel(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });

    setTransformerVersionFlag(cwd, options.transformerVersion);
  });
}

export function addApiWithThreeModels(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
      .sendCarriageReturn()
      .wait('Choose a schema template:')
      .sendKeyDown(1)
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
      .sendConfirmNo()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });

    setTransformerVersionFlag(cwd, options.transformerVersion);
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
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });

    setTransformerVersionFlag(cwd, options.transformerVersion);
  });
}

export function addApiWithBlankSchemaAndConflictDetection(
  cwd: string,
  opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {},
) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
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
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });

    setTransformerVersionFlag(cwd, options.transformerVersion);
  });
}

/**
 * Note: Lambda Authorizer is enabled only for Transformer V2
 */
export function addApiWithAllAuthModes(cwd: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services:')
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
      // eslint-disable-next-line spellcheck/spell-checker
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
      .wait(/.*Do you want to edit the local lambda function now*/)
      .sendConfirmNo()
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

    setTransformerVersionFlag(cwd, options.transformerVersion);
  });
}

export function updateApiSchema(cwd: string, projectName: string, schemaName: string, forceUpdate = false) {
  const testSchemaPath = getSchemaPath(schemaName);
  let schemaText = fs.readFileSync(testSchemaPath).toString();
  if (forceUpdate) {
    schemaText += '  ';
  }
  updateSchema(cwd, projectName, schemaText);
}

export function updateApiWithMultiAuth(cwd: string, settings?: { testingWithLatestCodebase?: boolean; doMigrate?: boolean }) {
  return new Promise<void>((resolve, reject) => {
    const testingWithLatestCodebase = settings?.testingWithLatestCodebase ?? false;
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true });
    chain.wait('Select from one of the below mentioned services:').sendCarriageReturn();
    const doMigrate = settings?.doMigrate ?? testingWithLatestCodebase;
    if (testingWithLatestCodebase) {
      chain.wait('Do you want to migrate api resource');
      if (doMigrate) {
        chain.sendConfirmYes();
      } else {
        chain.sendConfirmNo();
      }
    }
    chain
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
      // eslint-disable-next-line spellcheck/spell-checker
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
      .wait('Select from one of the below mentioned services:')
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
    const testingWithLatestCodebase = settings?.testingWithLatestCodebase ?? false;
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true });
    chain.wait('Select from one of the below mentioned services:').sendCarriageReturn();
    if (testingWithLatestCodebase === true) {
      chain.wait('Do you want to migrate api resource').sendYes();
    }
    chain
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

export type RestAPISettings = {
  path?: string;
  isFirstRestApi?: boolean;
  existingLambda?: boolean;
  restrictAccess?: boolean;
  allowGuestUsers?: boolean;
  projectContainsFunctions?: boolean;
  apiName?: string;
  hasUserPoolGroups?: boolean;
  isCrud?: boolean;
};
export function addRestApi(cwd: string, settings: RestAPISettings) {
  const isFirstRestApi = settings.isFirstRestApi ?? true;
  const chain = spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
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
        .wait('Choose a lambda source');

      if (settings.existingLambda) {
        chain
          .sendKeyDown()
          .sendCarriageReturn() // Existing lambda
          .wait('Choose the Lambda function to invoke by this path');
        if (settings.projectContainsFunctions) {
          chain.sendCarriageReturn(); // Pick first one
        }
      } else {
        chooseLambdaFunctionForRestApi(chain, settings);
      }
      protectAPI(settings, chain);
      chain.wait('Do you want to add another path').sendNo().sendEof();
      return chain.runAsync();
    }
    chain.sendNo();
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
    chooseLambdaFunctionForRestApi(chain, settings);
  }

  protectAPI(settings, chain);

  chain.wait('Do you want to add another path').sendNo().sendEof();

  return chain.runAsync();
}

function protectAPI(settings: RestAPISettings, chain: ExecutionContext) {
  chain.wait('Restrict API access');
  if (settings.restrictAccess) {
    chain.sendYes();

    if (settings.hasUserPoolGroups) {
      chain.wait('Restrict access by').sendCarriageReturn(); // Auth/Guest Users
    }

    chain.wait('Who should have access');

    if (settings.allowGuestUsers) {
      chain
        .sendKeyDown()
        .sendCarriageReturn() // Authenticated and Guest users
        .wait('What permissions do you want to grant to Authenticated users')
        .selectAll() // CRUD permissions for authenticated users
        .wait('What permissions do you want to grant to Guest users')
        .selectAll(); // CRUD permissions for guest users
    } else {
      chain
        .sendCarriageReturn() // Authenticated users only
        .wait('What permissions do you want to grant to Authenticated users')
        .selectAll(); // CRUD permissions
    }
  } else {
    chain.sendNo();
  }
}

function chooseLambdaFunctionForRestApi(chain: ExecutionContext, settings: { projectContainsFunctions?: boolean; isCrud?: boolean }) {
  if (settings.projectContainsFunctions) {
    chain.sendCarriageReturn(); // Create new Lambda function
  }
  chain.wait('Provide an AWS Lambda function name').sendCarriageReturn();

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

const updateRestApiDefaultSettings = {
  updateOperation: 'Add another path' as 'Add another path' | 'Update path' | 'Remove path',
  expectMigration: false,
  newPath: '/foo' as string | undefined,
  testingWithLatestCodebase: false,
};

export function updateRestApi(cwd: string, settings: Partial<typeof updateRestApiDefaultSettings> = {}) {
  const completeSettings = { ...updateRestApiDefaultSettings, ...settings };
  const chain = spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
    .wait('Select from one of the below mentioned services')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('What would you like to do')
    .sendLine(completeSettings.updateOperation);

  if (completeSettings.expectMigration) {
    chain.wait('A migration is needed to support latest updates on api resources.').sendYes();
  }
  switch (completeSettings.updateOperation) {
    case 'Add another path':
      chain
        .wait('Provide a path')
        .sendLine(completeSettings.newPath)
        .wait('Choose a Lambda source')
        .sendLine('Use a Lambda function already added in the current Amplify project');
      // assumes only one function in the project. otherwise, need to update to handle function selection here
      break;
    default:
      throw new Error(`updateOperation ${completeSettings.updateOperation} is not implemented`);
  }
  chain.wait('Restrict API access').sendNo().wait('Do you want to add another path').sendNo().wait('Successfully updated resource');
  return chain.runAsync();
}

const allAuthTypes = ['API key', 'Amazon Cognito User Pool', 'IAM', 'OpenID Connect'];

export function addApi(projectDir: string, authTypesConfig?: Record<string, $TSAny>, requireAuthSetup = true) {
  const transformerVersion = authTypesConfig?.transformerVersion ?? 2;
  delete authTypesConfig?.transformerVersion;

  let authTypesToSelectFrom = allAuthTypes.slice();
  return new Promise<void>((resolve, reject) => {
    const chain = spawn(getCLIPath(defaultOptions.testingWithLatestCodebase), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn();

    if (authTypesConfig && Object.keys(authTypesConfig).length > 0) {
      const authTypesToAdd = Object.keys(authTypesConfig);
      const defaultType = authTypesToAdd[0];

      chain
        .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
        .sendKeyUp(2)
        .sendCarriageReturn();

      singleSelect(chain.wait('Choose the default authorization type for the API'), defaultType, authTypesToSelectFrom);
      if (requireAuthSetup) setupAuthType(defaultType, chain, authTypesConfig);

      if (authTypesToAdd.length > 1) {
        authTypesToAdd.shift();

        chain.wait('Configure additional auth types?').sendConfirmYes();

        authTypesToSelectFrom = authTypesToSelectFrom.filter((x) => x !== defaultType);

        multiSelect(
          chain.wait('Choose the additional authorization types you want to configure for the API'),
          authTypesToAdd,
          authTypesToSelectFrom,
        );

        authTypesToAdd.forEach((authType) => {
          if (requireAuthSetup) setupAuthType(authType, chain, authTypesConfig);
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

    if (transformerVersion === 1) {
      addFeatureFlag(projectDir, 'graphqltransformer', 'transformerVersion', 1);
      addFeatureFlag(projectDir, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);
    }
  });
}

function setupAuthType(authType: string, chain: any, settings?: any) {
  switch (authType) {
    case 'API key':
      setupAPIKey(chain);
      break;
    case 'Amazon Cognito User Pool':
      setupCognitoUserPool(chain);
      break;
    case 'IAM':
      // no-op
      break;
    case 'OpenID Connect':
      setupOIDC(chain, settings);
      break;
    default:
      throw new Error(`Unknown auth type ${authType}`);
  }
}

function setupAPIKey(chain: any) {
  chain
    .wait('Enter a description for the API key')
    .sendCarriageReturn()
    .wait('After how many days from now the API key should expire')
    .sendCarriageReturn();
}

function setupCognitoUserPool(chain: any) {
  chain
    .wait('Do you want to use the default authentication and security configuration')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .sendCarriageReturn();
}

function setupOIDC(chain: any, settings?: any) {
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

export function addApiWithCognitoUserPoolAuthTypeWhenAuthExists(
  projectDir: string,
  opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {},
) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd: projectDir, stripColors: true })
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

    setTransformerVersionFlag(projectDir, options.transformerVersion);
  });
}
export function addRestContainerApi(projectDir: string, opts: Partial<AddApiOptions & { apiKeyExpirationDays: number }> = {}) {
  const options = _.assign(defaultOptions, opts);
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Select from one of the below mentioned services:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Which service would you like to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource to be used as a label for this category in the project:')
      .send(options.apiName)
      .sendCarriageReturn()
      .wait('What image would you like to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('When do you want to build & deploy the Fargate task')
      .sendCarriageReturn()
      .wait('Do you want to restrict API access')
      .sendConfirmNo()
      // eslint-disable-next-line spellcheck/spell-checker
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
      .run((err) => (err ? reject(err) : resolve()));
  });
}

export function addRestContainerApiForCustomPolicies(projectDir: string, settings: { name: string }) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd: projectDir, stripColors: true })
      .wait('Select from one of the below mentioned services:')
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
      // eslint-disable-next-line spellcheck/spell-checker
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

export function amplifyMockApi(cwd: string, testingWithLatestCodebase?: false): ExecutionContext {
    return spawn(getCLIPath(testingWithLatestCodebase), ['mock', 'api'], { cwd, stripColors: true, noOutputTimeout: 1000 * 60 * 20 });
};

export function cancelAmplifyMockApi(cwd: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['mock', 'api'], { cwd, stripColors: true })
      .wait('AppSync Mock endpoint is running')
      .sendCtrlC()
      .run((err: Error) => {
        if (err && !/Killed the process as no output receive for/.test(err.message)) {
          reject(err);
        } else {
          resolve();
        }
      });
  });
}

export async function validateRestApiMeta(projRoot: string, meta?: any) {
  meta = meta ?? getProjectMeta(projRoot);
  expect(meta.providers.awscloudformation).toBeDefined();
  const {
    AuthRoleArn: authRoleArn,
    UnauthRoleArn: unauthRoleArn,
    DeploymentBucketName: bucketName,
    Region: region,
    StackId: stackId,
  } = meta.providers.awscloudformation;
  expect(authRoleArn).toBeDefined();
  expect(unauthRoleArn).toBeDefined();
  expect(region).toBeDefined();
  expect(stackId).toBeDefined();
  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});

  expect(meta.function).toBeDefined();
  let seenAtLeastOneFunc = false;
  for (const key of Object.keys(meta.function)) {
    const { service, build, lastBuildTimeStamp, lastPackageTimeStamp, distZipFilename, lastPushTimeStamp, lastPushDirHash } =
      meta.function[key];
    expect(service).toBe('Lambda');
    expect(build).toBeTruthy();
    expect(lastBuildTimeStamp).toBeDefined();
    expect(lastPackageTimeStamp).toBeDefined();
    expect(distZipFilename).toBeDefined();
    expect(lastPushTimeStamp).toBeDefined();
    expect(lastPushDirHash).toBeDefined();
    seenAtLeastOneFunc = true;
  }
  expect(seenAtLeastOneFunc).toBe(true);
}
