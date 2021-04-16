import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import { nspawn as spawn, ExecutionContext, getCLIPath, KEY_DOWN_ARROW } from '..';
import { getLayerVersion, listVersions } from '../utils/sdk-calls';
import { multiSelect } from '../utils/selectors';
import { getBackendAmplifyMeta } from '../utils';
export type LayerRuntimes = 'nodejs' | 'python';
const PARAMETERS_FILE_NAME = 'parameters.json';

const layerRuntimeChoices = ['NodeJS', 'Python'];
const permissionChoices = ['Specific AWS accounts', 'Specific AWS organization', 'Public (Anyone on AWS can use this layer)'];

export function validateLayerDir(projRoot: string, layerName: string, runtimes: LayerRuntimes[]): boolean {
  let layerDir = path.join(projRoot, 'amplify', 'backend', 'function', layerName);
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

export function validatePushedVersion(
  projRoot: string,
  layerName: string,
  envName: string,
  version: number,
  permissions: LayerPermission[],
) {
  const layerData = getLayerConfig(projRoot, layerName);
  const storedPermissions: LayerPermission[] = layerData.permissions;
  permissions.forEach(perm => expect(storedPermissions).toContainEqual(perm));
}

export async function validateLayerMetadata(projRoot: string, layerName: string, meta: any, envName: string, arns: string[]) {
  const { Arn: arn } = meta.function[layerName].output;
  const region = meta.providers.awscloudformation.Region;
  const { runtimes } = getLayerRuntimes(projRoot, layerName);
  const runtimeValues = runtimes;

  expect(arn).toBeDefined();
  const cloudData = await getLayerVersion(arn, region);
  const { LayerVersions: Versions } = await listVersions(`${layerName}-${envName}`, region);
  const cloudVersions = Versions.map(version => version.LayerVersionArn);
  expect(cloudVersions.map(String).sort()).toEqual(arns.sort());
  expect(cloudData.LayerVersionArn).toEqual(arn);
  expect(cloudData.CompatibleRuntimes).toEqual(runtimeValues);
}
export function getCurrentLayerArnFromMeta(projroot: string, layerName: string): string {
  const meta = getBackendAmplifyMeta(projroot);
  return meta.function[layerName].output.Arn;
}

export function addLayer(cwd: string, settings?: any, testingWithLatestCodebase: boolean = false): Promise<void> {
  const defaultSettings = {
    permissions: [],
  };
  settings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    const chain: ExecutionContext = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Layer
      .wait('Provide a name for your Lambda layer:')
      .sendLine(settings.layerName);

    const runtimeDisplayNames = getRuntimeDisplayNames(settings.runtimes);
    expect(settings.runtimes.length === runtimeDisplayNames.length).toBe(true);

    chain.wait('Choose the runtime that you want to use:');
    multiSelect(chain, runtimeDisplayNames, layerRuntimeChoices);
    chain.wait('The current AWS account will always have access to this layer.');

    multiSelect(chain, settings.permissions, permissionChoices);
    chain.wait('Description').sendCarriageReturn();
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
export function removeLayer(cwd: string): Promise<void> {
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

export function updateLayer(cwd: string, settings?: any, testingWithLatestCodebase: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain: ExecutionContext = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn(); // Layer
    if (settings.numLayers > 1) {
      chain.wait('Select the Lambda layer to update:').sendCarriageReturn();
    }

    chain.wait('Do you want to adjust layer version permissions?').sendLine('y');
    if (settings.versions > 0) {
      chain.wait('Select the layer version to update').sendCarriageReturn(); // assumes updating the latest version
    }
    chain.wait('The current AWS account will always have access to this layer.');

    multiSelect(chain, settings.permissions, permissionChoices);

    waitForLayerSuccessPrintout(chain, settings, 'updated');
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function addOptData(projRoot: string, layerName: string): void {
  fs.writeFileSync(path.join(projRoot, 'amplify', 'backend', 'function', layerName, 'opt', 'data.txt'), 'data', 'utf8');
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

export function getLayerVersionArnFromCfn(projRoot: string, layerName: string): string[] {
  const cfnFilePath = path.join(projRoot, 'amplify', layerName, `${layerName}-awscloudformation-template.json`);
  const cfn = JSONUtilities.readJson(cfnFilePath) as $TSAny;
  const versionLogicalNames = Object.keys(cfn.Resources).filter(key => cfn.Resources[key].Type === 'AWS::Lambda::LayerVersion');
  return versionLogicalNames;
}

function getLayerConfig(projroot: string, layerName: string): $TSAny {
  const layerConfigPath = path.join(projroot, 'amplify', 'backend', 'function', layerName, 'layer-configuration.json');
  const layerConfig = JSONUtilities.readJson(layerConfigPath);
  return layerConfig;
}

function getLayerDataFromTeamProviderInfo(projRoot: string, layerName: string, envName: string) {
  const teamProviderInfoPath = path.join(projRoot, 'amplify', 'team-provider-info.json');
  const teamProviderInfo = JSONUtilities.readJson(teamProviderInfoPath);
  return _.get(teamProviderInfo, [envName, 'nonCFNdata', 'function', layerName]);
}

function getLayerRuntimes(projRoot: string, layerName: string): $TSAny {
  const runtimesFilePath = path.join(projRoot, 'amplify', 'backend', 'function', layerName, PARAMETERS_FILE_NAME);
  return JSONUtilities.readJson(runtimesFilePath);
}

function getRuntimeDisplayNames(runtimes: LayerRuntimes[]) {
  return runtimes.map(runtime => getLayerRuntimeInfo(runtime).displayName);
}

function getLayerRuntimeInfo(runtime: LayerRuntimes) {
  switch (runtime) {
    case 'nodejs':
      return { displayName: 'NodeJS', path: path.join('lib', runtime) };
    case 'python':
      return { displayName: 'Python', path: path.join('lib', runtime) };
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
}

function waitForLayerSuccessPrintout(chain: ExecutionContext, settings: any, action: string) {
  chain
    .wait(`✅ Lambda layer folders & files ${action}:`)
    .wait(path.join('amplify', 'backend', 'function', settings.layerName))
    .wait('Next steps:')
    .wait('Move your libraries to the following folder:');

  for (let runtime of settings.runtimes) {
    const { displayName, path } = getLayerRuntimeInfo(runtime);
    const layerRuntimeDir = `[${displayName}]: amplify/backend/function/${settings.layerName}/${path}`;
    chain.wait(layerRuntimeDir);
  }

  chain
    .wait('Include any files you want to share across runtimes in this folder:')
    .wait('"amplify function update <function-name>" - configure a function with this Lambda layer')
    .wait('"amplify push" - builds all of your local backend resources and provisions them in the cloud')
    .sendEof();
}
