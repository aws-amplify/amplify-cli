/* eslint-disable import/no-cycle */
import { $TSAny, $TSMeta, $TSObject, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecutionContext, getCLIPath, nspawn as spawn } from '..';
import { getBackendAmplifyMeta } from '../utils';
import { getLayerVersion, listVersions } from '../utils/sdk-calls';
import { multiSelect } from '../utils/selectors';

/**
 * valid layer runtime choices
 */
export type LayerRuntime = 'nodejs' | 'python';
type LayerRuntimeDisplayName = 'NodeJS' | 'Python';

/**
 * valid layer permission choices
 */
export type LayerPermissionChoice = 'Specific AWS accounts' | 'Specific AWS organization' | 'Public (Anyone on AWS can use this layer)';

export const layerRuntimeChoices: LayerRuntimeDisplayName[] = ['NodeJS', 'Python'];
export const permissionChoices: LayerPermissionChoice[] = [
  'Specific AWS accounts',
  'Specific AWS organization',
  'Public (Anyone on AWS can use this layer)',
];

const PARAMETERS_FILE_NAME = 'parameters.json';

/**
 * helper type for constructing the layer resource's path
 */
export type LayerDirectoryType = {
  layerName: string;
  projName: string; // TODO change to projectName and remove 'proj' from eslint dictionary
};

/**
 * validate layer directory
 */
export const validateLayerDir = (projectRoot: string, layerProjectName: LayerDirectoryType, runtimes: LayerRuntime[]): boolean => {
  const layerDir = path.join(projectRoot, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjectName));
  const validDir = fs.pathExistsSync(path.join(layerDir, 'opt'));
  if (runtimes && runtimes.length) {
    for (const runtime of runtimes) {
      if (!fs.pathExistsSync(path.join(layerDir, getLayerRuntimeInfo(runtime).runtimePath))) {
        return false;
      }
    }
  }
  return validDir;
};

/**
 * get the name of a layer directory
 */
export const getLayerDirectoryName = ({ layerName, projName }: { layerName: string; projName: string }): string =>
  `${projName}${layerName}`;

/**
 * validation helper for layer version
 */
export const validatePushedVersion = (projectRoot: string, layerProjectName: LayerDirectoryType, permissions: LayerPermission[]): void => {
  const layerData = getLayerConfig(projectRoot, getLayerDirectoryName(layerProjectName));
  const storedPermissions: LayerPermission[] = layerData.permissions;
  permissions.forEach((perm) => expect(storedPermissions).toContainEqual(perm));
};

/**
 * validation helper for ephemeral layer version permissions
 */
export const expectEphemeralPermissions = (
  projectRoot: string,
  layerProjectName: LayerDirectoryType,
  envName: string,
  version: number,
  permissions: LayerPermission[],
): void => {
  const layerData = getLayerConfig(projectRoot, getLayerDirectoryName(layerProjectName));
  const storedPermissions: LayerPermission[] = layerData?.ephemeral?.layerVersionPermissionsToUpdate?.[envName]?.[version];
  permissions.forEach((perm) => expect(storedPermissions).toContainEqual(perm));
};

/**
 * validation helper for ephemeral data
 */
export const expectEphemeralDataIsUndefined = (projectRoot: string, layerProjectName: LayerDirectoryType): void => {
  const layerData = getLayerConfig(projectRoot, getLayerDirectoryName(layerProjectName));
  const ephemeralData = layerData?.ephemeral;

  expect(ephemeralData).toBeUndefined();
};

/**
 * validation helper for layer version description
 */
export const expectDeployedLayerDescription = async (
  projectRoot: string,
  layerProjectName: LayerDirectoryType,
  meta: $TSMeta,
  envName: string,
  layerDescription: string,
): Promise<void> => {
  const arn = getCurrentLayerArnFromMeta(projectRoot, layerProjectName);
  const region = meta.providers.awscloudformation.Region;
  const { description } = getLayerRuntimes(projectRoot, getLayerDirectoryName(layerProjectName));

  expect(arn).toBeDefined();
  expect(description).toEqual(layerDescription);

  const { LayerVersions: Versions } = await listVersions(`${getLayerDirectoryName(layerProjectName)}-${envName}`, region);

  expect(Versions).toBeDefined();
  expect(Versions).toHaveLength(1);
  expect(Versions[0].Description).toEqual(layerDescription);
};

/**
 * validation helper for Lambda layers
 */
export const validateLayerMetadata = async (
  projectRoot: string,
  layerProjectName: LayerDirectoryType,
  meta: $TSMeta,
  envName: string,
  arns: string[],
): Promise<void> => {
  const arn = getCurrentLayerArnFromMeta(projectRoot, layerProjectName);
  const region = meta.providers.awscloudformation.Region;
  const { runtimes } = getLayerRuntimes(projectRoot, getLayerDirectoryName(layerProjectName));
  const runtimeValues = runtimes;

  expect(arn).toBeDefined();
  const cloudData = await getLayerVersion(arn, region);
  const { LayerVersions: Versions } = await listVersions(`${getLayerDirectoryName(layerProjectName)}-${envName}`, region);
  const cloudVersions = Versions.map((version) => version.LayerVersionArn);
  expect(cloudVersions.map(String).sort()).toEqual(arns.sort());
  expect(cloudData.LayerVersionArn).toEqual(arn);
  expect(cloudData.CompatibleRuntimes).toEqual(runtimeValues);
};

/**
 * get arn from amplify-meta.json
 */
export const getCurrentLayerArnFromMeta = (projectRoot: string, layerProjectName: LayerDirectoryType): string => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const layerName = getLayerDirectoryName(layerProjectName);
  return meta.function[layerName].output.Arn;
};

/**
 * add a Lambda layer resource via `amplify add function`
 */
export const addLayer = (
  cwd: string,
  settings: {
    layerName: string;
    permissions?: LayerPermissionChoice[];
    accountId?: string;
    orgId?: string;
    projName: string;
    runtimes: LayerRuntime[];
  },
  testingWithLatestCodebase = false,
): Promise<void> => {
  const defaultSettings = {
    permissions: [],
  };
  // eslint-disable-next-line no-param-reassign
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
};

/**
 * Remove all layer versions via `amplify remove function`
 * Assumes first item in list of functions is a layer and removes it
 */
export const removeLayer = (cwd: string, versionsToRemove: number[], allVersions: number[]): Promise<void> =>
  new Promise((resolve, reject) => {
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

/**
 * remove layer version via `amplify remove function`
 * assumes first item in list of functions is a layer and removes it
 */
export const removeLayerVersion = (
  cwd: string,
  settings: { removeLegacyOnly?: boolean; removeNoLayerVersions?: boolean },
  versionsToRemove: number[],
  allVersions: number[],
  testingWithLatestCodebase = false,
): Promise<void> =>
  new Promise((resolve, reject) => {
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

    if (!settings.removeNoLayerVersions) {
      chain.wait('All new layer versions created with the Amplify CLI will only be deleted on amplify push.');
    }

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

/**
 * update Lambda layer resource via `amplify update function`
 */
export const updateLayer = (
  cwd: string,
  settings?: {
    layerName?: string;
    projName?: string;
    runtimes?: string[];
    numLayers?: number;
    versions?: number;
    permissions?: string[];
    // eslint-disable-next-line spellcheck/spell-checker
    dontChangePermissions?: boolean;
    changePermissionOnFutureVersion?: boolean;
    changePermissionOnLatestVersion?: boolean;
    migrateLegacyLayer?: boolean;
  },
  testingWithLatestCodebase = false,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const chain: ExecutionContext = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'function'], { cwd, stripColors: true });
    if (settings.numLayers > 1) {
      chain.wait('Select the Lambda layer to update:').sendCarriageReturn();
    }

    if (settings.migrateLegacyLayer === true) {
      chain
        .wait('Amplify updated the way Lambda layers work to better support team workflows and additional features.')
        .wait('Continue?')
        .sendConfirmYes();
    }

    chain.wait('Do you want to adjust layer version permissions?');

    // eslint-disable-next-line spellcheck/spell-checker
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

/**
 * append passed in data to opt/data.txt for the given Lambda layer resource
 */
export const updateOptData = (projectRoot: string, layerProjectName: LayerDirectoryType, data: string): void => {
  fs.appendFileSync(
    path.join(projectRoot, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjectName), 'opt', 'data.txt'),
    data,
    'utf8',
  );
};

/**
 * write passed in data to opt/data.txt for the given Lambda layer resource
 */
export const addOptData = (projectRoot: string, layerProjectName: LayerDirectoryType, data = 'data'): void => {
  fs.writeFileSync(
    path.join(projectRoot, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjectName), 'opt', 'data.txt'),
    data,
    'utf8',
  );
};

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * layer permission enum
 */
export enum LayerPermissionName {
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
  private = 'Private',
  public = 'Public',
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * layer permission interface
 */
export interface LayerPermission {
  type: LayerPermissionName;
  accounts?: string[];
  orgs?: string[];
}

/**
 * get Lambda layer version arn from the local CloudFormation template
 */
export const getLayerVersionArnFromCfn = (projectRoot: string, layerProjectName: LayerDirectoryType): string[] => {
  const directoryName = getLayerDirectoryName(layerProjectName);
  const cfn = getLayerCfn(projectRoot, directoryName);
  const versionLogicalNames = Object.keys(cfn.Resources).filter((key) => cfn.Resources[key].Type === 'AWS::Lambda::LayerVersion');
  return versionLogicalNames;
};

const getLayerCfn = (projectRoot: string, layerDirectoryName: string): $TSObject => {
  const cfnFilePath = path.join(projectRoot, 'amplify', layerDirectoryName, `${layerDirectoryName}-awscloudformation-template.json`);
  const cfn = JSONUtilities.readJson<$TSObject>(cfnFilePath);
  return cfn;
};

const getLayerConfig = (projectRoot: string, layerName: string): $TSObject => {
  const layerConfigPath = path.join(projectRoot, 'amplify', 'backend', 'function', layerName, 'layer-configuration.json');
  const layerConfig = JSONUtilities.readJson<$TSObject>(layerConfigPath);
  return layerConfig;
};

const getLayerRuntimes = (projectRoot: string, layerName: string): $TSObject => {
  const runtimesFilePath = path.join(projectRoot, 'amplify', 'backend', 'function', layerName, PARAMETERS_FILE_NAME);
  return JSONUtilities.readJson<$TSObject>(runtimesFilePath);
};

/**
 * map display names for runtimes
 */
export const getRuntimeDisplayNames = (runtimes: LayerRuntime[]): string[] =>
  runtimes.map((runtime) => getLayerRuntimeInfo(runtime).displayName);

const getLayerRuntimeInfo = (runtime: LayerRuntime): { displayName: string; runtimePath: string } => {
  switch (runtime) {
    case 'nodejs':
      return { displayName: 'NodeJS', runtimePath: path.join('lib', runtime) };
    case 'python':
      return { displayName: 'Python', runtimePath: path.join('lib', runtime) };
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
};

const waitForLayerSuccessPrintout = (
  chain: ExecutionContext,
  settings: { layerName?: string; projName?: string; runtimes?: LayerRuntime[] } | $TSAny,
  action: string,
): void => {
  chain.wait(`✅ Lambda layer folders & files ${action}:`);

  if (settings?.runtimes?.length > 0) {
    chain
      .wait(path.join('amplify', 'backend', 'function', (settings.projName || '') + settings.layerName))
      .wait('Next steps:')
      .wait('Move your libraries to the following folder:');

    const runtimes = settings.layerName && settings.projName ? settings.runtimes : [];
    for (const runtime of runtimes) {
      const { displayName, runtimePath } = getLayerRuntimeInfo(runtime);
      const layerRuntimePathOutput = path.join(
        'amplify',
        'backend',
        'function',
        `${settings.projName + settings.layerName}`,
        `${runtimePath}`,
      );
      const layerRuntimeDirOutput = `[${displayName}]: ${layerRuntimePathOutput}`;
      chain.wait(layerRuntimeDirOutput);
    }
  }

  chain
    .wait('Include any files you want to share across runtimes in this folder:')
    .wait('"amplify function update <function-name>" - configure a function with this Lambda layer')
    .wait('"amplify push" - builds all of your local backend resources and provisions them in the cloud')
    .sendEof();
};
