import { pathManager } from 'amplify-cli-core';
import {
  ExecutionContext,
  getCLIPath,
  getRuntimeDisplayNames,
  LayerPermissionChoice,
  LayerRuntime,
  layerRuntimeChoices,
  multiSelect,
  nspawn as spawn,
  permissionChoices,
} from 'amplify-e2e-core';
import * as fs from 'fs';
import * as path from 'path';

export function legacyAddLayer(
  cwd: string,
  settings: {
    layerName: string;
    permissions?: LayerPermissionChoice[];
    accountId?: string;
    orgId?: string;
    projName: string;
    runtimes: LayerRuntime[];
  },
): Promise<void> {
  const defaultSettings = {
    permissions: [],
  };
  settings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    const chain: ExecutionContext = spawn(getCLIPath(false), ['add', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .sendKeyDown()
      .sendCarriageReturn() // Layer
      .wait('Provide a name for your Lambda layer:')
      .sendLine(settings.layerName);

    const runtimeDisplayNames = getRuntimeDisplayNames(settings.runtimes);
    expect(settings.runtimes.length === runtimeDisplayNames.length).toBe(true);

    chain.wait('Select up to 2 compatible runtimes:');
    multiSelect(chain, runtimeDisplayNames, layerRuntimeChoices);
    chain.wait('The current AWS account will always have access to this layer.');

    multiSelect(chain, settings.permissions, permissionChoices);

    if (settings.permissions.includes('Specific AWS accounts')) {
      chain.wait('Provide a list of comma-separated AWS account IDs:').sendLine(settings.accountId);
    }

    if (settings.permissions.includes('Specific AWS organization')) {
      chain.wait('Provide a list of comma-separated AWS organization IDs:').sendLine(settings.orgId);
    }

    chain.wait('Move your libraries to the following folder:');

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function legacyAddOptData(projRoot: string, layerName: string): void {
  fs.writeFileSync(path.join(projRoot, 'amplify', 'backend', 'function', layerName, 'opt', 'data.txt'), 'data', 'utf8');
}

export function validateLayerConfigFilesMigrated(projRoot: string, layerName: string) {
  const layerDirPath = pathManager.getResourceDirectoryPath(projRoot, 'function', layerName);
  return (
    fs.existsSync(path.join(layerDirPath, 'layer-configuration.json')) &&
    !fs.existsSync(path.join(layerDirPath, 'layer-runtimes.json')) &&
    !fs.existsSync(path.join(layerDirPath, 'layer-parameters.json'))
  );
}
