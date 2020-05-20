import { nspawn as spawn, ExecutionContext, KEY_DOWN_ARROW, getCLIPath /* getProjectMeta, invokeFunction */ } from '../../src';
import { runtimeChoices } from './lambda-function';
import { multiSelect, singleSelect } from '../utils/selectors';

type LayerRuntimes = 'dotnetcore3.1' | 'go1.x' | 'java' | 'nodejs' | 'python';

const permissionChoices = [
  'Only the current AWS account',
  'Specific AWS accounts',
  'Specific AWS organization',
  'Public (everyone on AWS can use this layer)',
];

export function addLayer(cwd: string, settings?: any) {
  const defaultSettings = {
    layerName: 'test-layer',
    runtimes: ['nodejs'],
    permission: 'private',
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
    singleSelect(chain, settings.permission, permissionChoices);

    const layerDirRegex = new RegExp('.*/amplify/backend/function/' + settings.layerName);

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
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function getRuntimeDisplayNames(runtimes: LayerRuntimes[]) {
  let runtimeDisplayNames = [];
  for (let i = 0; i < runtimes.length; ++i) {
    runtimeDisplayNames[i] = getRuntimeDisplayName(runtimes[i]);
  }
  return runtimeDisplayNames;
}

const getRuntimeDisplayName = (runtime: LayerRuntimes) => {
  switch (runtime) {
    case 'dotnetcore3.1':
      return '.NET Core 3.1';
    case 'go1.x':
      return 'Go';
    case 'java':
      return 'Java';
    case 'nodejs':
      return 'NodeJS';
    case 'python':
      return 'Python';
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
};
