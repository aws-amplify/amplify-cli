import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';
import { categoryName, layerParametersFileName } from '../utils/constants';

export type LayerVersionData = {
  version: LayerVersionMetadata;
};

export type LayerParameters = {
  layerName: string;
  runtimes: FunctionRuntime[];
  providerContext: ProviderContext;
  layerVersionMap?: LayerVersionData;
  build: boolean;
};

export enum Permission {
  private = 'private',
  public = 'public',
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
}

export type LayerMetadataFactory = (layerName: string) => LayerMetadata;

export interface LayerMetadata {
  runtimes: FunctionRuntime[];
  layerMetaData?: LayerVersionMetadata;
  getVersion: (version: number) => LayerVersionMetadata;
  listVersions: () => number[];
  getLatestVersion: () => number;
  getHash: (version: number) => string;
}

export interface LayerVersionMetadata {
  permissions: LayerPermission[];
  hash?: string;
  listAccoutAccess: () => string[];
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
  versionMap: Map<number, LayerVersionMetadata> = new Map();
  runtimes: FunctionRuntime[];
  layerMetaData: LayerVersionMetadata;
  constructor(obj) {
    this.runtimes = obj.runtimes;
    Object.entries(obj.layerVersionMap).forEach(([versionNumber, versionData]) => {
      this.layerMetaData = new LayerVersionState(versionData);
      this.versionMap.set(Number(versionNumber), this.layerMetaData);
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

  getHash(version: number): string {
    return this.getVersion(version).hash;
  }
}

class LayerVersionState implements LayerVersionMetadata {
  permissions: LayerPermission[];
  hash: string;
  constructor(versionData) {
    this.permissions = [];
    this.hash = versionData.hash;
    versionData.permissions.forEach(permission => {
      if (permission.type === Permission.public) {
        const permissionPublic: PublicLayer = {
          type: Permission.public,
        };
        this.permissions.push(permissionPublic);
      }
      if (permission.type === Permission.private) {
        const permissionPrivate: PrivateLayer = {
          type: Permission.private,
        };

        this.permissions.push(permissionPrivate);
      }
      if (permission.type === Permission.awsOrg) {
        const orgsPermissions: OrgsLayer = {
          type: Permission.awsOrg,
          orgs: permission.orgs,
        };
        this.permissions.push(orgsPermissions);
      }
      if (permission.type === Permission.awsAccounts) {
        const accountsPermissions: AccountsLayer = {
          type: Permission.awsAccounts,
          accounts: permission.accounts,
        };
        this.permissions.push(accountsPermissions);
      }
    });
  }

  listAccoutAccess(): string[] {
    let accounts: string[] = [];
    this.permissions.forEach(permission => {
      if (permission.type === Permission.awsAccounts) {
        accounts = permission.accounts;
      }
    });
    return accounts;
  }

  listOrgAccess(): string[] {
    let orgs: string[] = [];
    this.permissions.forEach(permission => {
      if (permission.type === Permission.awsOrg) {
        orgs = permission.orgs;
      }
    });
    return orgs;
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
    const obj = context.amplify.readJsonFile(parametersFilePath);
    return new LayerState(obj);
  };
};
