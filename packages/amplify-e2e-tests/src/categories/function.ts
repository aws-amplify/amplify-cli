import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addFunction(cwd: string, settings: any, verbose: boolean = !isCI()) {
  let moveDown = (chain, nmoves) => Array.from(Array(nmoves).keys()).reduce((chain, _idx) => chain.send('\x1b[B'), chain);

  return new Promise((resolve, reject) => {
    let chain = nexpect
      .spawn(getCLIPath(), ['add', 'function'], { cwd, stripColors: true, verbose })
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
        break;
    }

    chain
      .sendline('\r')
      .wait('Do you want to access other resources created in this project from your Lambda')
      .sendline('n')
      .wait('Do you want to edit the local lambda function now')
      .sendline('n')
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

function addCrud(chain: nexpect.IChain, cwd: string, settings: any, verbose: boolean) {
  return chain;
}

function addLambdaTrigger(chain: nexpect.IChain, cwd: string, settings: any, verbose: boolean) {
  return (
    chain
      .wait('What event source do you want to associate with Lambda trigger')
      // Amazon DynamoDB Stream
      .sendline(settings.triggerType == 'Kinesis' ? '\x1b[B\r' : '\r')
      .wait(`Choose a ${settings.triggerType} event source option`)
    // Use API category graphql @model backed DynamoDB table(s) in the current Amplify project
    //.sendline('\r')
  );
  // NOTE: uncomment when selecting from multiple models
  // .wait('Please choose graphql @models')
  // .sendline(' ')
  // .sendline('\r')
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
