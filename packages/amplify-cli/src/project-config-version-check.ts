import * as path from 'path';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as yaml from 'js-yaml';
import _ from 'lodash';
import glob from 'glob';
import { coerce, lt } from 'semver';
import { Context } from './domain/context';
import { ConfirmQuestion } from 'inquirer';
import { JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';

const previousLambdaRuntimeVersions = ['nodejs8.10', 'nodejs10.x'];
const lambdaRuntimeVersion = 'nodejs12.x';

// Register custom tags for yaml parser
const CF_SCHEMA = new yaml.Schema([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: function (data) {
      return { Ref: data };
    },
  }),
  new yaml.Type('!Condition', {
    kind: 'sequence',
    construct: function (data) {
      return { Condition: data };
    },
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Equals': data };
    },
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Not': data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::If': data };
    },
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Join': data };
    },
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Select': data };
    },
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::FindInMap': data };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::GetAtt': Array.isArray(data) ? data : data.split('.') };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::GetAtt': Array.isArray(data) ? data : data.split('.') };
    },
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::GetAZs': data };
    },
  }),
  new yaml.Type('!Base64', {
    kind: 'mapping',
    construct: function (data) {
      return { 'Fn::Base64': data };
    },
  }),
  new yaml.Type('!Split', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Split': data };
    },
  }),
  new yaml.Type('!Cidr', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Cidr': data };
    },
  }),
  new yaml.Type('!ImportValue', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::ImportValue': data };
    },
  }),
  new yaml.Type('!Transform', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Transform': data };
    },
  }),
  new yaml.Type('!And', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::And': data };
    },
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Or': data };
    },
  }),
]);

export async function checkProjectConfigVersion(context: Context): Promise<void> {
  const { constants } = context.amplify;
  const projectPath = pathManager.findProjectRoot();

  if (projectPath) {
    const projectConfig = stateManager.getProjectConfig(projectPath, {
      throwIfNotExist: false,
      default: undefined,
    });

    // If we do not have a projectConig, just bail out, probably it is an
    // uninitialized project
    if (!projectConfig?.version) {
      return;
    }

    const currentProjectVersion = coerce(projectConfig.version);
    const minProjectVersion = coerce(constants.MIN_NODE12_PROJECT_CONFIG_VERSION);

    // If coerceProjectVersion fails for some reason bail out
    if (currentProjectVersion === null) {
      const error = new Error(`Invalid project version was found in project-config.json: '${projectConfig.version}'`);

      error.stack = undefined;

      throw error;
    }

    if (lt(currentProjectVersion!, minProjectVersion!)) {
      await checkLambdaCustomResourceNodeVersion(context, projectPath);

      projectConfig.version = constants.CURRENT_PROJECT_CONFIG_VERSION;

      stateManager.setProjectConfig(projectPath, projectConfig);
    }
  }
}

///////////////////////////////////////////////////////////////////
////// check lambda custom resources nodejs runtime version ///////
///////////////////////////////////////////////////////////////////
async function checkLambdaCustomResourceNodeVersion(context: Context, projectPath: string): Promise<boolean> {
  const { pathManager } = context.amplify;
  const backendDirPath = pathManager.getBackendDirPath(projectPath);

  let result = false;
  const filesToUpdate: string[] = [];

  if (fs.existsSync(backendDirPath)) {
    const globOptions: glob.IOptions = {
      absolute: false,
      cwd: backendDirPath,
      follow: false,
      nodir: true,
    };

    const templateFileNames = glob.sync('**/*template.{yaml,yml,json}', globOptions);

    for (const templateFileName of templateFileNames) {
      const absolutePath = path.join(backendDirPath, templateFileName);
      const fileContent = fs.readFileSync(absolutePath, 'utf8');

      if (checkFileContent(fileContent)) {
        filesToUpdate.push(templateFileName);
      }
    }
  }

  if (filesToUpdate.length > 0) {
    const confirmed = context.input.options?.yes || (await promptForConfirmation(context, filesToUpdate));

    if (confirmed) {
      for (const fileName of filesToUpdate) {
        const absolutePath = path.join(backendDirPath, fileName);
        const fileContent = fs.readFileSync(absolutePath, 'utf8');

        const newFileContent = updateFileContent(fileContent);

        fs.writeFileSync(absolutePath, newFileContent, 'utf8');
      }

      context.print.info('');
      context.print.success(`Node.js runtime version successfully updated to ${lambdaRuntimeVersion} in all the CloudFormation templates.`);
      context.print.warning('Run “amplify push” to deploy the updated templates to the cloud.');

      result = true;
    }
  } else {
    // No update means 'updated' for caller
    result = true;
  }

  return result;
}

function checkFileContent(fileContent: string): boolean {
  const { cfnTemplate } = getCFNTemplate(fileContent);

  const resources = _.get(cfnTemplate, 'Resources', {});
  const lambdaFunctions = _.filter(
    resources,
    r => r.Type === 'AWS::Lambda::Function' && previousLambdaRuntimeVersions.includes(_.get(r, ['Properties', 'Runtime'], undefined)),
  );

  return lambdaFunctions.length > 0;
}

function updateFileContent(fileContent: string): string {
  const { isJson, cfnTemplate } = getCFNTemplate(fileContent);

  const resources = _.get(cfnTemplate, 'Resources', {});
  const lambdaFunctions = _.filter(
    resources,
    r => r.Type === 'AWS::Lambda::Function' && previousLambdaRuntimeVersions.includes(_.get(r, ['Properties', 'Runtime'], undefined)),
  );

  lambdaFunctions.map(f => (f.Properties.Runtime = lambdaRuntimeVersion));

  let result: string | undefined;

  if (isJson) {
    result = JSONUtilities.stringify(cfnTemplate);
  } else {
    result = yaml.dump(cfnTemplate);
  }

  return result!;
}

function isJsonFileContent(fileContent: string): boolean {
  // We use the first character to determine if the content is json or yaml because historically the CLI could
  // have emitted JSON with YML extension, so we can't rely on filename extension.
  return fileContent?.trim()[0] === '{'; // CFN templates are always objects, never arrays
}

function getCFNTemplate(fileContent: string): { isJson; cfnTemplate: Record<string, any> } {
  // We use the first character to determine if the content is json or yaml because historically the CLI could
  // have emitted JSON with YML extension, so we can't rely on filename extension.
  const isJson = isJsonFileContent(fileContent);

  let cfnTemplate: Record<string, any>;

  if (isJson) {
    cfnTemplate = JSONUtilities.parse<Record<string, any>>(fileContent);
  } else {
    cfnTemplate = yaml.load(fileContent, { schema: CF_SCHEMA }) as Record<string, any>;
  }

  return { isJson, cfnTemplate };
}

async function promptForConfirmation(context: Context, filesToUpdate: string[]): Promise<boolean> {
  context.print.info('');
  context.print.info('Amplify CLI uses AWS Lambda to manage part of your backend resources.');
  context.print.info(
    `In response to the Lambda Runtime support deprecation schedule, the Node.js runtime needs to be updated from ${previousLambdaRuntimeVersions.join(
      ', ',
    )} to ${lambdaRuntimeVersion} in the following template files:`,
  );

  for (const fileToUpdate of filesToUpdate) {
    context.print.info(fileToUpdate);
  }

  context.print.info('');

  context.print.warning(
    `Test the changes in a test environment before pushing them to production. There might be a need to update your Lambda function source code due to the Node.js runtime update. Take a look at https://docs.amplify.aws/cli/migration/lambda-node-version-update for more information`,
  );

  context.print.info('');

  const question: ConfirmQuestion = {
    type: 'confirm',
    name: 'confirmUpdateNodeVersion',
    message: `Confirm to update the Node.js runtime version to ${lambdaRuntimeVersion}`,
    default: true,
  };

  const answer = await inquirer.prompt(question);

  if (!answer.confirmUpdateNodeVersion) {
    const warningMessage = `After a runtime is deprecated, \
Lambda might retire it completely at any time by disabling invocation. \
Deprecated runtimes aren't eligible for security updates or technical support. \
Before retiring a runtime, Lambda sends additional notifications to affected customers.`;
    context.print.warning(warningMessage);
    context.print.info('You will need to manually update the Node.js runtime in the template files and push the updates to the cloud.');
  }

  return answer.confirmUpdateNodeVersion;
}
