import fs from 'fs-extra';
import path from 'path';
import { nspawn as spawn, ExecutionContext, KEY_DOWN_ARROW, getCLIPath } from '../../src';
import { runtimeChoices } from './lambda-function';
import { multiSelect } from '../utils/selectors';

type LayerRuntimes = 'dotnetcore3.1' | 'go1.x' | 'java' | 'nodejs' | 'python';

const permissionChoices = [
  'Only the current AWS account',
  'Specific AWS accounts',
  'Specific AWS organization',
  'Public (everyone on AWS can use this layer)',
];

export function validateLayerDir(projRoot: string, layerName: string, layerExists: boolean, runtimes: LayerRuntimes[]): boolean {
  let layerDir = path.join(projRoot, 'amplify', 'backend', 'function', layerName);
  if (layerExists) {
    let validDir = fs.pathExistsSync(path.join(layerDir, 'opt'));
    if (runtimes && runtimes.length) {
      for (let runtime of runtimes) {
        if (!fs.pathExistsSync(path.join(layerDir, getLayerRuntimeInfo(runtime).path))) {
          return false;
        }
      }
    }
    return validDir;
  } else {
    return !fs.pathExistsSync(layerDir);
  }
}

export function addLayer(cwd: string, settings?: any) {
  const defaultSettings = {
    layerName: 'test-layer',
    runtimes: ['nodejs'],
    permission: ['Only the current AWS account'],
  };
  settings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    let chain: ExecutionContext = spawn(getCLIPath(), ['add', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Layer
      .wait('Provide a name for your Lambda layer:')
      .sendLine(settings.layerName);

    const runtimeDisplayNames = getRuntimeDisplayNames(settings.runtimes);
    expect(settings.runtimes.length === runtimeDisplayNames.length).toBeTruthy();

    chain.wait('Select up to 5 compatible runtimes:');
    multiSelect(chain, runtimeDisplayNames, runtimeChoices);
    chain.wait('Who should have permission to use this layer?');
    multiSelect(chain, settings.permission, permissionChoices);

    const layerDirRegex = new RegExp('.*/amplify/backend/function/' + settings.layerName);

    chain = printFlow(chain,settings ,layerDirRegex , runtimeDisplayNames);
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// Assumes first item in list is a layer and removes it
export function removeLayer(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'function'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn() // first one
      .wait('When you delete a layer version, you can no longer configure functions to use it.')
      .wait('However, any function that already uses the layer version continues to have access to it.')
      .sendLine('y')
      .wait('Successfully removed resource')
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

export function updateLayer(cwd: string, settings?: any) {
  const defaultSettings = {
    layerName: 'test-layer',
    runtimes: ['java'],
    permission: ['Public (everyone on AWS can use this layer)'],
  };
  settings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    let chain: ExecutionContext = spawn(getCLIPath(), ['update', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Layer
      .wait('Please select the Lambda Layer you would want to update')
      .sendCarriageReturn();

    const runtimeDisplayNames = getRuntimeDisplayNames(settings.runtimes);
    expect(settings.runtimes.length === runtimeDisplayNames.length).toBeTruthy();

    chain.wait('Do you want to change the compatible runtimes?').sendLine('y');
    chain.wait('Select up to 5 compatible runtimes:');
    multiSelect(chain, runtimeDisplayNames, runtimeChoices);
    chain.wait('Do you want to adjust who can access the current & new layer version? ').sendLine('y');
    chain.wait('Who should have permission to use this layer?');
    multiSelect(chain, settings.permission, permissionChoices);

    const layerDirRegex = new RegExp('.*/amplify/backend/function/' + settings.layerName);

    chain = printFlow(chain,settings ,layerDirRegex , runtimeDisplayNames);
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function getRuntimeDisplayNames(runtimes: LayerRuntimes[]) {
  return runtimes.map(runtime => getLayerRuntimeInfo(runtime).displayName);
}

function getLayerRuntimeInfo(runtime: LayerRuntimes) {
  switch (runtime) {
    case 'dotnetcore3.1':
      return { displayName: '.NET Core 3.1', path: path.join('bin', runtime) };
    case 'go1.x':
      return { displayName: 'Go', path: path.join('bin', runtime) };
    case 'java':
      return { displayName: 'Java', path: path.join('bin', runtime, 'lib') };
    case 'nodejs':
      return { displayName: 'NodeJS', path: path.join('src', runtime, 'node_modules') };
    case 'python':
      return { displayName: 'Python', path: path.join('src', runtime) };
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
};

function printFlow(chain : ExecutionContext , settings : any ,layerDirRegex , runtimeDisplayNames){
  chain
  .wait('Lambda layer folders & files created:')
  .wait(layerDirRegex)
  .wait('Next steps:')
  .wait('Move your libraries in the following folder:');

  for (let i = 0; i < settings.runtimes.length; ++i) {
    let layerRuntimeDirRegex = new RegExp(
      `\\[${runtimeDisplayNames[i]}\\]: ` +
        '.*/amplify/backend/function/' +
        settings.layerName +
        '/(?:src|bin)/' +
        settings.runtimes[i] +
        '/*',
    );
    chain.wait(layerRuntimeDirRegex);
  }

  chain
    .wait('Include any files you want to share across runtimes in this folder:')
    .wait('"amplify function update <function-name>" - configure a function with this Lambda layer')
    .wait('"amplify push" builds all of your local backend resources and provisions them in the cloud')
    .sendEof()
  return chain;
}
