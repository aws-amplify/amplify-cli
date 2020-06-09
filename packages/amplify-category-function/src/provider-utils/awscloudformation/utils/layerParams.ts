import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import path from 'path';
import { categoryName, layerParametersFileName } from '../utils/constants';
import fs from 'fs-extra';

export type LayerParameters = {
  layerName: string;
  runtimes: FunctionRuntime[];
  providerContext: ProviderContext;
  layerVersionsMap?: Object;
  build: boolean;
};

export enum Permissions {
  private = 'private',
  public = 'public',
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
}

export type LayerMetadataFactory = (context: any, layerName: string, isPush?: boolean) => LayerMetadata;

export interface LayerMetadata {
  runtimes: FunctionRuntime[];
  layerMetaData: LayerVersionMetadata;
  getVersion: (version: number) => LayerVersionMetadata;
  listVersions: () => number[];
  getLatestVersion: () => number;
}

export interface LayerVersionMetadata {
  permissions: LayerPermission[];
  listAccoutAccess: () => string[];
  listOrgAccess: () => string[];
  isPrivate: () => boolean;
  isPublic: () => boolean;
}

export type LayerPermission = PrivateLayer | PublicLayer | AccountsLayer | OrgsLayer;

export interface PrivateLayer {
  type: Permissions.private;
}

export interface PublicLayer {
  type: Permissions.public;
}

export interface AccountsLayer {
  type: Permissions.awsAccounts;
  accounts: string[];
}

export interface OrgsLayer {
  type: Permissions.awsOrg;
  orgs: string[];
}

class LayerState implements LayerMetadata {
  versionMap: Map<number, LayerVersionMetadata> = new Map();
  runtimes: FunctionRuntime[];
  layerMetaData: LayerVersionMetadata;
  constructor(obj) {
    this.runtimes = obj.runtimes;
    Object.entries(obj.layerVersionsMap).forEach(([key, value]) => {
      this.layerMetaData = new LayerVersionState(value);
      this.versionMap.set(Number(key), this.layerMetaData);
    });
  }

  getVersion(version: number): LayerVersionMetadata {
    return this.versionMap.get(version);
  }

  listVersions(): number[] {
    return Array.from(this.versionMap.keys());
  }
  getLatestVersion(): number {
    return Array.from(this.versionMap.keys()).reduce((a, b) => Math.max(a, b));
  }
}

class LayerVersionState implements LayerVersionMetadata {
  permissions: LayerPermission[];
  constructor(value) {
    this.permissions = [];
    value.forEach(permission => {
      if (permission.type === Permissions.public) {
        const permissionPublic: PublicLayer = {
          type: Permissions.public,
        };
        this.permissions.push(permissionPublic);
      }
      if (permission.type === Permissions.private) {
        const permissionPrivate: PrivateLayer = {
          type: Permissions.private,
        };

        this.permissions.push(permissionPrivate);
      }
      if (permission.type === Permissions.awsOrg) {
        const orgsPermissions: OrgsLayer = {
          type: Permissions.awsOrg,
          orgs: permission.orgs,
        };
        this.permissions.push(orgsPermissions);
      }
      if (permission.type === Permissions.awsAccounts) {
        const accountsPermissions: AccountsLayer = {
          type: Permissions.awsAccounts,
          accounts: permission.accounts,
        };
        this.permissions.push(accountsPermissions);
      }
    });
  }

  listAccoutAccess(): string[] {
    let accounts: string[] = [];
    if (!(this.permissions === undefined || this.permissions.length == 0)) {
      this.permissions.forEach(permission => {
        if (permission.type === Permissions.awsAccounts) {
          accounts = permission.accounts;
        }
      });
    }
    return accounts;
  }

  listOrgAccess(): string[] {
    let orgs: string[] = [];
    if (!(this.permissions === undefined || this.permissions.length == 0)) {
      this.permissions.forEach(permission => {
        if (permission.type === Permissions.awsOrg) {
          orgs = permission.orgs;
        }
      });
    }
    return orgs;
  }

  isPrivate(): boolean {
    let retVal: boolean = false;
    if (!(this.permissions === undefined || this.permissions.length == 0)) {
      this.permissions.forEach(permission => {
        if (permission.type === Permissions.private) {
          retVal = true;
        }
      });
    }
    return retVal;
  }

  isPublic(): boolean {
    let retVal: boolean = false;
    if (!(this.permissions === undefined || this.permissions.length == 0)) {
      this.permissions.forEach(permission => {
        if (permission.type === Permissions.public) {
          retVal = true;
        }
      });
    }
    return retVal;
  }
}

export const layerMetadataFactory: LayerMetadataFactory = (context: any, layerName: string, isPush: boolean = false): LayerMetadata => {
  let projectBackendDirPath;
  if (!isPush) {
    projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  } else {
    projectBackendDirPath = context.amplify.pathManager.getCurrentCloudBackendDirPath();
  }
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, layerName);
  if (!fs.existsSync(resourceDirPath)) {
    return undefined;
  }
  const parametersFilePath = path.join(resourceDirPath, layerParametersFileName);
  const obj = context.amplify.readJsonFile(parametersFilePath).parameters;
  return new LayerState(obj);
};
