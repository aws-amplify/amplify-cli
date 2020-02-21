import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../../utils';
import * as fs from 'fs-extra';
import * as path from 'path';
import { HOSTING, RESOURCE, TYPE, TYPE_UNKNOWN, CATEGORIES } from './constants';

export function addManualHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Manual deployment')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addCICDsHostingWithoutFrontend(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Continuous deployment (Git-based deployments)')
      //move up
      .send('k')
      .sendline('\r')
      .wait('Continuous deployment is configured in the Amplify Console. Please hit enter once you connect your repository')
      .sendline('\r')
      .wait("No hosting URL found. Run 'amplify add hosting' again to set up hosting with Amplify Console.")
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyPublish(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['hosting', 'publish'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyPush(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['push'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function npmInstall(cwd: string, verbose: boolean = !isCI()) {
    return new Promise((resolve, reject) => {
        nexpect
            .spawn('npm install', { cwd, stripColors: true, verbose })
            .run((err: Error) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
    });
}

export function removeHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Choose the resource you would want to remove')
      .sendline('\r')
      .wait('Are you sure you want to delete the resource?')
      .sendline('\r')
      .wait('Successfully removed resource')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function loadTypeFromTeamProviderInfo(cwd: string, currEnv: string) {
  const teamProviderPath = path.join(cwd, 'amplify', 'team-provider-info.json');
  const content = readJsonFile(teamProviderPath);
  // console.log(JSON.stringify(content));
  if (
    content 
    && content[currEnv]
    && content[currEnv][CATEGORIES]
    && content[currEnv][CATEGORIES][HOSTING] 
    && content[currEnv][CATEGORIES][HOSTING][RESOURCE] 
    && content[currEnv][CATEGORIES][HOSTING][RESOURCE][TYPE]
  ) {
    return content[currEnv][CATEGORIES][HOSTING][RESOURCE][TYPE];
  } else {
    return TYPE_UNKNOWN;
  }
}

function readJsonFile(jsonFilePath: string, encoding = 'utf8') {
  return JSON.parse(fs.readFileSync(jsonFilePath, encoding));
}
