import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export let moveDown = (chain: nexpect.IChain, nmoves: number) =>
  Array.from(Array(nmoves).keys()).reduce((chain, _idx) => chain.send('\x1b[B'), chain);

export function multiselect<T>(chain: nexpect.IChain, items: T[], allChoices: T[]) {
  return (
    items
      .map(item => allChoices.indexOf(item))
      .filter(idx => idx > -1)
      .sort()
      // calculate the diff with the latest, since items are sorted, always positive
      // represents the numbers of moves down we need to make to selection
      .reduce((diffs, move) => (diffs.length > 0 ? [...diffs, move - diffs[diffs.length - 1]] : [move]), [] as number[])
      .reduce((chain, move) => moveDown(chain, move).send(' '), chain)
      .sendline('\r')
  );
}

function _coreFunction(cwd: string, settings: any, action: 'create' | 'update', verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    let chain = nexpect.spawn(getCLIPath(), [action == 'update' ? 'update' : 'add', 'function'], {
      cwd,
      stripColors: true,
      verbose,
      stream: settings.expectFailure ? 'all' : 'stdout',
    });

    if (action == 'create') {
      chain = chain
        .wait('Provide a friendly name for your resource to be used as a label')
        .sendline(settings.name || '\r')
        .wait('Provide the AWS Lambda function name')
        .sendline(settings.name || '\r')
        .wait('Choose the function template that you want to use');

      switch (settings.functionTemplate || 'helloWorld') {
        case 'crud':
          chain = addCrud(moveDown(chain, 1).sendline('\r'), cwd, settings, verbose);
          break;
        case 'lambdaTrigger':
          chain = addLambdaTrigger(moveDown(chain, 3).sendline('\r'), cwd, settings, verbose);
          break;
        default:
          chain = chain.sendline('\r');
          break;
      }
    } else {
      chain = chain.wait('Please select the Lambda Function you would want to update').sendline('\r');
    }

    if (!settings.expectFailure) {
      chain = chain.wait(
        action == 'create'
          ? 'Do you want to access other resources created in this project from your Lambda'
          : 'Do you want to update permissions granted to this Lambda function',
      );

      if (settings.additionalPermissions) {
        chain = multiselect(
          chain.sendline('y').wait('Select the category'),
          settings.additionalPermissions.permissions,
          settings.additionalPermissions.choices,
        );
        // when single resource, it gets autoselected
        if (settings.additionalPermissions.resources.length > 1) {
          chain = multiselect(
            chain.wait('Select the one you would like your'),
            settings.additionalPermissions.resources,
            settings.additionalPermissions.resourceChoices,
          );
        }

        // n-resources repeated questions
        chain = settings.additionalPermissions.resources.reduce(
          (chain, elem) =>
            multiselect(chain.wait(`Select the operations you want to permit for ${elem}`), settings.additionalPermissions.operations, [
              'create',
              'read',
              'update',
              'delete',
            ]),
          chain,
        );
      } else {
        chain = chain.sendline('n');
      }

      chain = chain
        .wait('Do you want to edit the local lambda function now')
        .sendline('n')
        .sendEof();
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function addFunction(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return _coreFunction(cwd, settings, 'create', verbose);
}

export function updateFunction(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return _coreFunction(cwd, settings, 'update', verbose);
}

function addCrud(chain: nexpect.IChain, cwd: string, settings: any, verbose: boolean) {
  return chain.sendline('\r');
}

function addLambdaTrigger(chain: nexpect.IChain, cwd: string, settings: any, verbose: boolean) {
  const res = chain
    .wait('What event source do you want to associate with Lambda trigger')
    // Amazon DynamoDB Stream
    .sendline(settings.triggerType == 'Kinesis' ? '\x1b[B\r' : '\r')
    .wait(`Choose a ${settings.triggerType} event source option`)
    /**
     * Use API category graphql @model backed DynamoDB table(s) in the current Amplify project
     * or
     * Use storage category DynamoDB table configured in the current Amplify project
     */
    .sendline(settings.eventSource == 'DynamoDB' ? `\x1b[B\r` : '\r');

  switch (settings.triggerType + (settings.eventSource || '')) {
    case 'DynamoDBAppSync':
      return settings.expectFailure ? res.wait('No AppSync resources have been configured in API category.') : res;
    case 'DynamoDBDynamoDB':
      return settings.expectFailure
        ? res.wait('There are no DynamoDB resources configured in your project currently')
        : res.wait('Choose from one of the already configured DynamoDB tables').sendline('\r');
    case 'Kinesis':
      return settings.expectFailure
        ? res.wait('No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream')
        : res;
    default:
      return res;
  }
}

export function functionBuild(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['function', 'build'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue building the resources?')
      .sendline('Y')
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
