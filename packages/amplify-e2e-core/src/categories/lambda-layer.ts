import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecutionContext, getCLIPath, nspawn as spawn } from '..';
import { getBackendAmplifyMeta } from '../utils';
import { getLayerVersion, listVersions } from '../utils/sdk-calls';
import { multiSelect } from '../utils/selectors';

export type LayerRuntime = 'nodejs' | 'python';
type LayerRuntimeDisplayName = 'NodeJS' | 'Python';
export type LayerPermissionChoice = 'Specific AWS accounts' | 'Specific AWS organization' | 'Public (Anyone on AWS can use this layer)';

export const layerRuntimeChoices: LayerRuntimeDisplayName[] = ['NodeJS', 'Python'];
export const permissionChoices: LayerPermissionChoice[] = [
  'Specific AWS accounts',
  'Specific AWS organization',
  'Public (Anyone on AWS can use this layer)',
];

const PARAMETERS_FILE_NAME = 'parameters.json';

export type LayerDirectoryType = {
  layerName: string;
  projName: string;
};

export function validateLayerDir(projRoot: string, layerProjName: LayerDirectoryType, runtimes: LayerRuntime[]): boolean {
  let layerDir = path.join(projRoot, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjName));
  let validDir = fs.pathExistsSync(path.join(layerDir, 'opt'));
  if (runtimes && runtimes.length) {
    for (let runtime of runtimes) {
      if (!fs.pathExistsSync(path.join(layerDir, getLayerRuntimeInfo(runtime).path))) {
        return false;
      }
    }
  }
  return validDir;
}

export function getLayerDirectoryName({ layerName, projName }: { layerName: string; projName: string }): string {
  return `${projName}${layerName}`;
}

export function validatePushedVersion(projRoot: string, layerProjName: LayerDirectoryType, permissions: LayerPermission[]) {
  const layerData = getLayerConfig(projRoot, getLayerDirectoryName(layerProjName));
  const storedPermissions: LayerPermission[] = layerData.permissions;
  permissions.forEach(perm => expect(storedPermissions).toContainEqual(perm));
}

export function expectEphemeralPermissions(
  projRoot: string,
  layerProjName: LayerDirectoryType,
  envName: string,
  version: number,
  permissions: LayerPermission[],
) {
  const layerData = getLayerConfig(projRoot, getLayerDirectoryName(layerProjName));
  const storedPermissions: LayerPermission[] = layerData?.ephemeral?.layerVersionPermissionsToUpdate?.[envName]?.[version];
  permissions.forEach(perm => expect(storedPermissions).toContainEqual(perm));
}

export function expectEphemeralDataIsUndefined(projRoot: string, layerProjName: LayerDirectoryType) {
  const layerData = getLayerConfig(projRoot, getLayerDirectoryName(layerProjName));
  const ephemeralData = layerData?.ephemeral;

  expect(ephemeralData).toBeUndefined();
}

export async function expectDeployedLayerDescription(
  projRoot: string,
  layerProjName: LayerDirectoryType,
  meta: any,
  envName: string,
  layerDescription: string,
) {
  const arn = getCurrentLayerArnFromMeta(projRoot, layerProjName);
  const region = meta.providers.awscloudformation.Region;
  const { description } = getLayerRuntimes(projRoot, getLayerDirectoryName(layerProjName));

  expect(arn).toBeDefined();
  expect(description).toEqual(layerDescription);

  const { LayerVersions: Versions } = await listVersions(`${getLayerDirectoryName(layerProjName)}-${envName}`, region);

  expect(Versions).toBeDefined();
  expect(Versions).toHaveLength(1);
  expect(Versions[0].Description).toEqual(layerDescription);
}

export async function validateLayerMetadata(
  projRoot: string,
  layerProjName: LayerDirectoryType,
  meta: any,
  envName: string,
  arns: string[],
) {
  const arn = getCurrentLayerArnFromMeta(projRoot, layerProjName);
  const region = meta.providers.awscloudformation.Region;
  const { runtimes } = getLayerRuntimes(projRoot, getLayerDirectoryName(layerProjName));
  const runtimeValues = runtimes;

  expect(arn).toBeDefined();
  const cloudData = await getLayerVersion(arn, region);
  const { LayerVersions: Versions } = await listVersions(`${getLayerDirectoryName(layerProjName)}-${envName}`, region);
  const cloudVersions = Versions.map(version => version.LayerVersionArn);
  expect(cloudVersions.map(String).sort()).toEqual(arns.sort());
  expect(cloudData.LayerVersionArn).toEqual(arn);
  expect(cloudData.CompatibleRuntimes).toEqual(runtimeValues);
}

export function getCurrentLayerArnFromMeta(projroot: string, layerProjName: LayerDirectoryType): string {
  const meta = getBackendAmplifyMeta(projroot);
  const layerName = getLayerDirectoryName(layerProjName);
  return meta.function[layerName].output.Arn;
}

export function addLayer(
  cwd: string,
  settings: {
    layerName: string;
    permissions?: LayerPermissionChoice[];
    accountId?: string;
    orgId?: string;
    projName: string;
    runtimes: LayerRuntime[];
  },
  testingWithLatestCodebase: boolean = false,
): Promise<void> {
  const defaultSettings = {
    permissions: [],
  };
  settings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    const chain: ExecutionContext = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .sendKeyDown()
      .sendCarriageReturn() // Layer
      .wait('Provide a name for your Lambda layer:')
      .sendLine(settings.layerName);

    const runtimeDisplayNames = getRuntimeDisplayNames(settings.runtimes);
    expect(settings.runtimes.length === runtimeDisplayNames.length).toBe(true);

    chain.wait('Choose the runtime that you want to use:');
    multiSelect(chain, runtimeDisplayNames, layerRuntimeChoices);
    chain.wait('The current AWS account will always have access to this layer.');

    multiSelect(chain, settings.permissions, permissionChoices);

    if (settings.permissions.includes('Specific AWS accounts')) {
      chain.wait('Provide a list of comma-separated AWS account IDs:').sendLine(settings.accountId);
    }

    if (settings.permissions.includes('Specific AWS organization')) {
      chain.wait('Provide a list of comma-separated AWS organization IDs:').sendLine(settings.orgId);
    }

    waitForLayerSuccessPrintout(chain, settings, 'created');

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
export function removeLayer(cwd: string, versionsToRemove: number[], allVersions: number[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['remove', 'function'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn() // first one
      .wait('When you delete a layer version, you can no longer configure functions to use it.')
      .wait('However, any function that already uses the layer version continues to have access to it.')
      .wait('Choose the Layer versions you want to remove.');

    multiSelect(chain, versionsToRemove, allVersions);

    chain
      .wait('Are you sure you want to delete the resource? This action')
      .sendConfirmYes()
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

export function removeLayerVersion(
  cwd: string,
  settings: { removeLegacyOnly?: boolean },
  versionsToRemove: number[],
  allVersions: number[],
  testingWithLatestCodebase = false,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['remove', 'function'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn() // first one
      .wait('When you delete a layer version, you can no longer configure functions to use it.')
      .wait('However, any function that already uses the layer version continues to have access to it.')
      .wait('Choose the Layer versions you want to remove.');

    multiSelect(chain, versionsToRemove, allVersions);

    if (settings.removeLegacyOnly) {
      chain.wait(/Warning: By continuing, these layer versions \[.+\] will be immediately deleted./);
    }

    chain.wait('All new layer versions created with the Amplify CLI will only be deleted on amplify push.');

    if (settings.removeLegacyOnly) {
      chain.wait('✔ Layers deleted');
    }

    chain.sendEof().run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function updateLayer(
  cwd: string,
  settings?: {
    layerName?: string;
    projName?: string;
    runtimes?: string[];
    numLayers?: number;
    versions?: number;
    permissions?: string[];
    dontChangePermissions?: boolean;
    changePermissionOnFutureVersion?: boolean;
    changePermissionOnLatestVersion?: boolean;
    migrateLegacyLayer?: boolean;
  },
  testingWithLatestCodebase: boolean = false,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain: ExecutionContext = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .sendKeyDown()
      .sendCarriageReturn(); // Layer
    if (settings.numLayers > 1) {
      chain.wait('Select the Lambda layer to update:').sendCarriageReturn();
    }

    if (settings.migrateLegacyLayer === true) {
      chain
        .wait('⚠️  Amplify updated the way Lambda layers work to better support team workflows and additional features.')
        .wait('Continue?')
        .sendConfirmYes();
    }

    chain.wait('Do you want to adjust layer version permissions?');

    if (settings.dontChangePermissions === true) {
      chain.sendConfirmNo();
    } else {
      chain.sendConfirmYes();

      // Compatibility with existing e2e tests
      if (settings.versions > 0) {
        chain
          .wait('Select the layer version to update')
          .sendKeyDown() // Move down from "future layer" option
          .sendCarriageReturn(); // assumes updating the latest layer version
      } else if (settings.changePermissionOnFutureVersion === true) {
        chain.wait('Select the layer version to update').sendCarriageReturn(); // future layer version
      } else if (settings.changePermissionOnLatestVersion === true) {
        chain
          .wait('Select the layer version to update')
          .sendKeyDown() // Move down from "future layer" option
          .sendCarriageReturn(); // latest layer version
      }

      chain.wait('The current AWS account will always have access to this layer.');

      multiSelect(chain, settings.permissions, permissionChoices);

      waitForLayerSuccessPrintout(chain, settings, 'updated');
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

export function updateOptData(projRoot: string, layerProjName: LayerDirectoryType, data: string) {
  fs.appendFileSync(
    path.join(projRoot, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjName), 'opt', 'data.txt'),
    data,
    'utf8',
  );
}

export function addOptData(projRoot: string, layerProjName: LayerDirectoryType, data: string = 'data'): void {
  fs.writeFileSync(
    path.join(projRoot, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjName), 'opt', 'data.txt'),
    data,
    'utf8',
  );
}

export enum LayerPermissionName {
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
  private = 'Private',
  public = 'Public',
}

export interface LayerPermission {
  type: LayerPermissionName;
  accounts?: string[];
  orgs?: string[];
}

export function getLayerVersionArnFromCfn(projRoot: string, layerProjName: LayerDirectoryType): string[] {
  const directoryName = getLayerDirectoryName(layerProjName);
  const cfn = getLayerCfn(projRoot, directoryName);
  const versionLogicalNames = Object.keys(cfn.Resources).filter(key => cfn.Resources[key].Type === 'AWS::Lambda::LayerVersion');
  return versionLogicalNames;
}

function getLayerCfn(projRoot: string, layerDirectoryName: string) {
  const cfnFilePath = path.join(projRoot, 'amplify', layerDirectoryName, `${layerDirectoryName}-awscloudformation-template.json`);
  const cfn = JSONUtilities.readJson(cfnFilePath) as $TSAny;
  return cfn;
}

function getLayerConfig(projroot: string, layerName: string): $TSAny {
  const layerConfigPath = path.join(projroot, 'amplify', 'backend', 'function', layerName, 'layer-configuration.json');
  const layerConfig = JSONUtilities.readJson(layerConfigPath);
  return layerConfig;
}

function getLayerRuntimes(projRoot: string, layerName: string): $TSAny {
  const runtimesFilePath = path.join(projRoot, 'amplify', 'backend', 'function', layerName, PARAMETERS_FILE_NAME);
  return JSONUtilities.readJson(runtimesFilePath);
}

export function getRuntimeDisplayNames(runtimes: LayerRuntime[]) {
  return runtimes.map(runtime => getLayerRuntimeInfo(runtime).displayName);
}

function getLayerRuntimeInfo(runtime: LayerRuntime) {
  switch (runtime) {
    case 'nodejs':
      return { displayName: 'NodeJS', path: path.join('lib', runtime) };
    case 'python':
      return { displayName: 'Python', path: path.join('lib', runtime) };
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
}

function waitForLayerSuccessPrintout(
  chain: ExecutionContext,
  settings: { layerName?: string; projName?: string; runtimes?: LayerRuntime[] } | $TSAny,
  action: string,
) {
  chain
    .wait(`✅ Lambda layer folders & files ${action}:`)
    .wait(path.join('amplify', 'backend', 'function', settings.projName + settings.layerName))
    .wait('Next steps:')
    .wait('Move your libraries to the following folder:');

  const runtimes = settings.runtimes && settings.layerName && settings.projName ? settings.runtimes : [];
  for (const runtime of runtimes) {
    const { displayName, path } = getLayerRuntimeInfo(runtime);
    const layerRuntimeDir = `[${displayName}]: amplify/backend/function/${settings.projName + settings.layerName}/${path}`;
    chain.wait(layerRuntimeDir);
  }

  chain
    .wait('Include any files you want to share across runtimes in this folder:')
    .wait('"amplify function update <function-name>" - configure a function with this Lambda layer')
    .wait('"amplify push" - builds all of your local backend resources and provisions them in the cloud')
    .sendEof();
}
