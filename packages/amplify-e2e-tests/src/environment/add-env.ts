import { nspawn as spawn, getCLIPath } from 'amplify-e2e-core';

export function addEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
      .wait('Do you want to use an AWS profile?')
      .sendLine('yes')
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
      .wait('Initialized your environment successfully.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function checkoutEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'checkout', settings.envName], { cwd, stripColors: true })
      .wait('Initialized your environment successfully.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// Test multiple Environments by passing settings.numEnv
export function listEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    let numEnv = settings.numEnv || 1;
    let regex = /\|\s\*?[a-z]{2,10}\s+\|/;
    let chain = spawn(getCLIPath(), ['env', 'list'], { cwd, stripColors: true })
      .wait('| Environments |')
      .wait('| ------------ |');

    for (let i = 0; i < numEnv; ++i) {
      chain = chain.wait(regex);
    }

    chain = chain.sendEof().run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// Helper function for getEnvironment()
function _addQuotes(s: string, prefix: string): string {
  return s.replace(prefix, '"' + prefix + '"').replace(': ', ':"') + '"';
}

// Get environment details and return them as JSON
export function getEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    var envData = '';
    spawn(getCLIPath(), ['env', 'get', '--name', settings.envName], { cwd, stripColors: true })
      .wait(settings.envName)
      .wait('--------------')
      .wait('Provider', output => (envData = envData.concat('', output.replace('Provider: ', '{"') + '":{')))
      .wait('AuthRoleName', output => (envData = envData.concat('', _addQuotes(output, 'AuthRoleName'))))
      .wait('UnauthRoleArn', output => (envData = envData.concat(',', _addQuotes(output, 'UnauthRoleArn'))))
      .wait('Region', output => (envData = envData.concat(',', _addQuotes(output, 'Region'))))
      .wait('DeploymentBucketName', output => (envData = envData.concat(',', _addQuotes(output, 'DeploymentBucketName'))))
      .wait('UnauthRoleName', output => (envData = envData.concat(',', _addQuotes(output, 'UnauthRoleName'))))
      .wait('StackName', output => (envData = envData.concat(',', _addQuotes(output, 'StackName'))))
      .wait('StackId', output => (envData = envData.concat(',', _addQuotes(output, 'StackId') + '}}')))
      .wait('--------------')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve(envData);
          return envData;
        } else {
          reject(err);
        }
      });
  });
}

/*
  `amplify env pull` only outputs via ora.spinner,
  but nexpect can't wait() on the spinner output
  See amplify-cli/src/initialize-env.js
*/
export function pullEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'pull'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function importEnvironment(cwd: string, settings: any) {
  const cmd_array = [
    'env',
    'import',
    '--name',
    settings.envName,
    '--config',
    settings.providerConfig,
    '--yes', // If env with same name already exists, overwrite it
  ];

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), cmd_array, { cwd, stripColors: true })
      .wait('Successfully added environment from your project')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          console.error(err);
          reject(err);
        }
      });
  });
}

export function removeEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'remove', settings.envName], { cwd, stripColors: true })
      .wait(`Are you sure you want to continue?`)
      .sendLine('y')
      .wait('Successfully removed environment from your project locally')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
