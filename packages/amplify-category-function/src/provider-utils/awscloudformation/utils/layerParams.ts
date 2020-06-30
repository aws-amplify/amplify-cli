import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';
import { categoryName, layerParametersFileName } from '../utils/constants';
import { category } from '../../../constants';
import { hashLayerVersionContents } from './packageLayer';

export type LayerVersionMap = Record<number, Pick<LayerVersionMetadata, 'permissions' | 'hash'>>;

export type LayerRuntime = Pick<FunctionRuntime, 'name' | 'value' | 'layerExecutablePath' | 'cloudTemplateValue'>;

export type LayerParameters = {
  layerName: string;
  runtimes: LayerRuntime[];
  providerContext: ProviderContext;
  layerVersionMap?: LayerVersionMap;
  build: boolean;
};

export type StoredLayerParameters = Pick<LayerParameters, 'runtimes' | 'layerVersionMap'>;

export enum Permission {
  private = 'private',
  public = 'public',
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
}

export type LayerMetadataFactory = (layerName: string) => LayerMetadata;

export interface LayerMetadata {
  layerName: string;
  runtimes: LayerRuntime[];
  getVersion: (version: number) => LayerVersionMetadata;
  listVersions: () => number[];
  getLatestVersion: () => number;
  getHash: (version: number) => string;
  syncVersions: () => Promise<boolean>;
  updateCompatibleRuntimes: (runtimes: LayerRuntime[]) => void;
  setPermissionsForVersion: (version: number, permissions: LayerPermission[]) => void;
  setNewVersionHash: () => Promise<void>;
  toStoredLayerParameters: () => StoredLayerParameters;
}

export interface LayerVersionMetadata {
  permissions: LayerPermission[];
  hash?: string;
  listAccountAccess: () => string[];
  listOrgAccess: () => string[];
  isPrivate: () => boolean;
  isPublic: () => boolean;
}

export type LayerPermission = PrivateLayer | PublicLayer | AccountsLayer | OrgsLayer;

export interface PrivateLayer {
  type: Permission.private;
}

export interface PublicLayer {
  type: Permission.public;
}

export interface AccountsLayer {
  type: Permission.awsAccounts;
  accounts: string[];
}

export interface OrgsLayer {
  type: Permission.awsOrg;
  orgs: string[];
}

class LayerState implements LayerMetadata {
  readonly layerName: string;
  runtimes: LayerRuntime[];
  private context;
  private versionMap: Map<number, LayerVersionState> = new Map();

  private storedParams: StoredLayerParameters;
  private newVersionHash: string;
  constructor(context, storedParams: StoredLayerParameters, layerName: string) {
    this.context = context;
    this.layerName = layerName;
    this.storedParams = storedParams;
    this.runtimes = storedParams.runtimes;
    Object.entries(storedParams.layerVersionMap).forEach(([versionNumber, versionData]) => {
      this.versionMap.set(Number(versionNumber), new LayerVersionState(versionData));
    });
  }

  getVersion(version: number): LayerVersionMetadata {
    return this.versionMap.get(version);
  }

  listVersions(): number[] {
    return Array.from(this.versionMap.keys()).sort((a, b) => Number(b) - Number(a));
  }

  getLatestVersion(): number {
    const versions = this.listVersions();
    return versions.length > 0 ? versions[0] : undefined;
  }

  getHash(version: number): string {
    return this.getVersion(version).hash;
  }

  // sets the hash for a new (not yet pushed) layer version
  // once a hash is set for a version, this should indicate that the version is "finialized" (ie pushed or about to be pushed)
  // hashes are immutable once set
  async setNewVersionHash() {
    const latestVersion = this.getLatestVersion();
    // if the latest version doesn't already have a hash
    if (!this.getHash(latestVersion)) {
      const newHash = this.newVersionHash || (await this.hashLayer());
      this.getVersion(latestVersion).hash = newHash;
      this.storedParams.layerVersionMap[latestVersion].hash = newHash;
      this.newVersionHash = undefined; // reset the newVersionHash now that the latest one is set
    }
  }

  // updates the layer metadata with a new version if changes are detected
  // if a new version is detected, the permissions from the previous version are carried forward to the new version
  // returns true if a new version was detected, false otherwise
  // it does not set a hash for a new version if detected because the version could change more before a push
  async syncVersions(): Promise<boolean> {
    const latestVersion = this.getLatestVersion();
    const currHash = this.getHash(latestVersion);
    if (!currHash) {
      return false;
    }
    this.newVersionHash = await this.hashLayer();
    if (currHash !== this.newVersionHash) {
      this.addNewLayerVersion();
      return true;
    }
    return false;
  }

  updateCompatibleRuntimes(runtimes: LayerRuntime[]) {
    const existingRuntimeVals = this.runtimes.map(runtime => runtime.value).sort();
    const newRuntimeVals = runtimes.map(runtime => runtime.value).sort();
    const areRuntimesSame = _.isEqual(existingRuntimeVals, newRuntimeVals);
    if (!areRuntimesSame) {
      this.updateRuntimes(runtimes);
      if (this.isLatestVersionFinalized()) {
        this.addNewLayerVersion();
      }
    }
  }

  setPermissionsForVersion(version: number, permissions: LayerPermission[]) {
    this.storedParams.layerVersionMap[version].permissions = permissions;
    this.versionMap.get(version).setPermissions(permissions);
  }

  toStoredLayerParameters(): StoredLayerParameters {
    return _.cloneDeep(this.storedParams);
  }

  private isLatestVersionFinalized(): boolean {
    return this.getHash(this.getLatestVersion()) !== undefined;
  }

  private hashLayer() {
    const layerPath = path.join(this.context.amplify.pathManager.getBackendDirPath(), category, this.layerName);
    return hashLayerVersionContents(layerPath);
  }

  private updateRuntimes(runtimes: LayerRuntime[]) {
    this.runtimes = runtimes;
    this.storedParams.runtimes = runtimes;
  }

  private addNewLayerVersion() {
    const currVersion = this.getLatestVersion();
    const newVersion = currVersion + 1;
    const prevPermissions = this.getVersion(currVersion).permissions;
    this.storedParams.layerVersionMap[newVersion] = {
      permissions: _.cloneDeep(prevPermissions),
    };
    this.versionMap.set(newVersion, new LayerVersionState(this.storedParams.layerVersionMap[newVersion]));
  }
}

class LayerVersionState implements LayerVersionMetadata {
  permissions: LayerPermission[];
  hash: string;
  constructor(versionData: Pick<LayerVersionMetadata, 'permissions' | 'hash'>) {
    this.permissions = [];
    this.hash = versionData.hash;
    this.setPermissions(versionData.permissions);
  }

  setPermissions(permissions: LayerPermission[]) {
    this.permissions = permissions.map(permission => {
      switch (permission.type) {
        case Permission.public:
          return {
            type: Permission.public,
          } as PublicLayer;
        case Permission.private:
          return {
            type: Permission.private,
          };
        case Permission.awsOrg:
          return {
            type: Permission.awsOrg,
            orgs: permission.orgs,
          };
        case Permission.awsAccounts:
          return {
            type: Permission.awsAccounts,
            accounts: permission.accounts,
          };
      }
    });
  }

  listAccountAccess(): string[] {
    const permissionIsAccount = (permission: LayerPermission): permission is AccountsLayer => permission.type === Permission.awsAccounts;
    const accountPermissions = this.permissions.find(permissionIsAccount);
    return accountPermissions ? accountPermissions.accounts : [];
  }

  listOrgAccess(): string[] {
    const permissionIsOrg = (permission: LayerPermission): permission is OrgsLayer => permission.type === Permission.awsOrg;
    const orgPermissions = this.permissions.find(permissionIsOrg);
    return orgPermissions ? orgPermissions.orgs : [];
  }

  isPrivate(): boolean {
    return !!this.permissions.map(perm => perm.type).find(type => type === Permission.private);
  }

  isPublic(): boolean {
    return !!this.permissions.map(perm => perm.type).find(type => type === Permission.public);
  }
}

export const getLayerMetadataFactory = (context: any): LayerMetadataFactory => {
  return layerName => {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const resourceDirPath = path.join(projectBackendDirPath, categoryName, layerName);
    if (!fs.existsSync(resourceDirPath)) {
      return undefined;
    }
    const parametersFilePath = path.join(resourceDirPath, layerParametersFileName);
    const obj = context.amplify.readJsonFile(parametersFilePath) as StoredLayerParameters;
    return new LayerState(context, obj, layerName);
  };
};
