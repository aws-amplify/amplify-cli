import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addFunction(cwd: string, settings: any, verbose: boolean = !isCI()) {
  let moveDown = (chain, nmoves) => Array.from(Array(nmoves).keys()).reduce((chain, _idx) => chain.send('\x1b[B'), chain);

  return new Promise((resolve, reject) => {
    let chain = nexpect
      .spawn(getCLIPath(), ['add', 'function'], { cwd, stripColors: true, verbose, stream: settings.expectFailure ? 'all' : 'stdout' })
      .wait('Provide a friendly name for your resource to be used as a label')
      .sendline('\r')
      .wait('Provide the AWS Lambda function name')
      .sendline('\r')
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

    if (!settings.expectFailure) {
      chain = chain
        .wait('Do you want to access other resources created in this project from your Lambda')
        .sendline('n')
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
      return settings.expectFailure ? res.wait('There are no DynamoDB resources configured in your project currently') : res;
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
