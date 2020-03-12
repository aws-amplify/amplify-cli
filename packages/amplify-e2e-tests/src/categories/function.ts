import { nspawn as spawn, ExecutionContext, KEY_DOWN_ARROW } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';
import { StartNextPendingJobExecutionRequest } from 'aws-sdk/clients/iotjobsdataplane';

export let moveDown = (chain: ExecutionContext, nMoves: number) =>
  Array.from(Array(nMoves).keys()).reduce((chain, _idx) => chain.send(KEY_DOWN_ARROW), chain);

export function multiSelect<T>(chain: ExecutionContext, items: T[], allChoices: T[]) {
  return (
    items
      .map(item => allChoices.indexOf(item))
      .filter(idx => idx > -1)
      .sort()
      // calculate the diff with the latest, since items are sorted, always positive
      // represents the numbers of moves down we need to make to selection
      .reduce((diffs, move) => (diffs.length > 0 ? [...diffs, move - diffs[diffs.length - 1]] : [move]), [] as number[])
      .reduce((chain, move) => moveDown(chain, move).send(' '), chain)
      .sendCarriageReturn()
  );
}

function _coreFunction(cwd: string, settings: any, action: 'create' | 'update') {
  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), [action == 'update' ? 'update' : 'add', 'function'], {
      cwd,
      stripColors: true,
    });

    if (action == 'create') {
      chain = chain
        .wait('Provide a friendly name for your resource to be used as a label')
        .sendLine(settings.name || '')
        .wait('Provide the AWS Lambda function name')
        .sendLine(settings.name || '')
        .wait('Choose the function template that you want to use');

      switch (settings.functionTemplate || 'helloWorld') {
        case 'crud':
          chain = addCrud(moveDown(chain, 1).sendCarriageReturn(), cwd, settings);
          break;
        case 'lambdaTrigger':
          chain = addLambdaTrigger(moveDown(chain, 3).sendCarriageReturn(), cwd, settings);
          break;
        default:
          chain = chain.sendCarriageReturn();
          break;
      }
    } else {
      chain = chain.wait('Please select the Lambda Function you would want to update').sendCarriageReturn();
    }

    if (!settings.expectFailure) {
      chain = chain.wait(
        action == 'create'
          ? 'Do you want to access other resources created in this project from your Lambda'
          : 'Do you want to update permissions granted to this Lambda function',
      );

      if (settings.additionalPermissions) {
        chain = multiSelect(
          chain.sendLine('y').wait('Select the category'),
          settings.additionalPermissions.permissions,
          settings.additionalPermissions.choices,
        );
        // when single resource, it gets autoselected
        if (settings.additionalPermissions.resources.length > 1) {
          chain = multiSelect(
            chain.wait('Select the one you would like your'),
            settings.additionalPermissions.resources,
            settings.additionalPermissions.resourceChoices,
          );
        }

        // n-resources repeated questions
        chain = settings.additionalPermissions.resources.reduce(
          (chain, elem) =>
            multiSelect(chain.wait(`Select the operations you want to permit for ${elem}`), settings.additionalPermissions.operations, [
              'create',
              'read',
              'update',
              'delete',
            ]),
          chain,
        );
      } else {
        chain = chain.sendLine('n');
      }

      // scheduling questions
      chain = chain
        .wait(action == 'create' ? 'Do you want to schedule this lambda function?' : 'Do you want to Update/Remove the ScheduleEvent Rule?')
        .sendLine('y');
      if (settings.schedulePermissions) {
        chain = cronWalkthrough(chain, settings, action);
      } else {
        chain = chain.sendLine('n');
      }
      // scheduling questions
      chain = chain
        .wait('Do you want to edit the local lambda function now')
        .sendLine('n')
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

export function addFunction(cwd: string, settings: any) {
  return _coreFunction(cwd, settings, 'create');
}

export function updateFunction(cwd: string, settings: any) {
  return _coreFunction(cwd, settings, 'update');
}

function addCrud(chain: ExecutionContext, cwd: string, settings: any) {
  return chain.sendCarriageReturn();
}

function addLambdaTrigger(chain: ExecutionContext, cwd: string, settings: any) {
  const res = chain
    .wait('What event source do you want to associate with Lambda trigger')
    // Amazon DynamoDB Stream
    .sendLine(settings.triggerType === 'Kinesis' ? KEY_DOWN_ARROW : '')
    .wait(`Choose a ${settings.triggerType} event source option`)
    /**
     * Use API category graphql @model backed DynamoDB table(s) in the current Amplify project
     * or
     * Use storage category DynamoDB table configured in the current Amplify project
     */
    .sendLine(settings.eventSource === 'DynamoDB' ? KEY_DOWN_ARROW : '');

  switch (settings.triggerType + (settings.eventSource || '')) {
    case 'DynamoDBAppSync':
      return settings.expectFailure ? res.wait('No AppSync resources have been configured in API category.') : res;
    case 'DynamoDBDynamoDB':
      return settings.expectFailure
        ? res.wait('There are no DynamoDB resources configured in your project currently')
        : res.wait('Choose from one of the already configured DynamoDB tables').sendCarriageReturn();
    case 'Kinesis':
      return settings.expectFailure
        ? res.wait('No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream')
        : res;
    default:
      return res;
  }
}

export function functionBuild(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['function', 'build'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue building the resources?')
      .sendLine('Y')
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

function cronWalkthrough(chain: ExecutionContext, settings: any, action: string) {
  if (action === 'create') {
    chain = addCron(chain, settings);
  } else {
    chain = chain.wait('Select from the following options').sendCarriageReturn();
    switch (settings.schedulePermissions.action) {
      case 'Update':
        chain = addCron(chain, settings);
        break;
      case 'Remove':
        chain = chain.sendCarriageReturn();
        break;
      default:
        chain = chain.sendCarriageReturn();
        break;
    }
  }
  return chain;
}
function addminutes(chain: ExecutionContext) {
  chain = chain
    .wait('Enter rate for mintues(1-59)?')
    .sendLine('5\r')
    .sendCarriageReturn();
  return chain;
}
function addhourly(chain: ExecutionContext) {
  chain = chain
    .wait('Enter rate for hours(1-23)?')
    .sendLine('5\r')
    .sendCarriageReturn();
  return chain;
}
function addWeekly(chain: ExecutionContext) {
  chain = chain.wait('Please select the  day to start Job').sendCarriageReturn();
  return chain;
}

function addMonthly(chain: ExecutionContext) {
  chain = chain.wait('Select date to start cron').sendCarriageReturn();
  return chain;
}

function addYearly(chain: ExecutionContext) {
  chain = chain.wait('Select date to start cron').sendCarriageReturn();
  return chain;
}

function addCron(chain: ExecutionContext, settings: any) {
  chain = chain
    .wait('When would you like to start cron')
    .sendCarriageReturn()
    .wait('Please select interval or select custom rule exp?');

  console.log(settings.schedulePermissions.interval);
  switch (settings.schedulePermissions.interval || 'daily') {
    case 'minutes':
      chain = addminutes(chain);
      break;
    case 'hourly':
      chain = addhourly(moveDown(chain, 1).sendCarriageReturn());
      break;
    case 'daily':
      chain = moveDown(chain, 2).sendCarriageReturn();
      break;
    case 'weekly':
      chain = addWeekly(moveDown(chain, 3).sendCarriageReturn());
      break;
    case 'monthly':
      chain = addMonthly(moveDown(chain, 4).sendCarriageReturn());
      break;
    case 'yearly':
      chain = addYearly(moveDown(chain, 5).sendCarriageReturn());
      break;
    default:
      chain = chain.sendCarriageReturn();
      break;
  }
  return chain;
}
