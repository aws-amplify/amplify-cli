import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import path from 'path';

export type LayerParameters = {
  layerName: string;
  layerPermissions: Permissions[];
  runtimes: FunctionRuntime[];
  providerContext: ProviderContext;
  authorizedAccountIds?: string;
  authorizedOrgId?: string;
  layerVersionsMap?: Object;
};

export enum Permissions {
  private = 'private',
  public = 'public',
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
}

export type LayerMetadataFactory = (obj : Object) => LayerMetadata;

export interface LayerMetadata {
  runtimes: FunctionRuntime[]
  getVersion: (version: number) => LayerVersionMetadata
  listVersions:() => number[]
}

export interface LayerVersionMetadata {
  permissions: LayerPermission[]
}

export type LayerPermission = PrivateLayer | PublicLayer | AccountsLayer | OrgsLayer

export interface PrivateLayer {
  type: Permissions.private
}

export interface PublicLayer {
  type: Permissions.public
}

export interface AccountsLayer {
  type: Permissions.awsAccounts
  accounts: string[]
}

export interface OrgsLayer {
  type: Permissions.awsOrg
  orgs: string[]
}

 class LayerState implements LayerMetadata , LayerVersionMetadata{
  versionsMap : Map<number , LayerPermission[]> = new Map();
  runtimes: FunctionRuntime[];
  permissions: LayerPermission[];
  constructor(obj){
    this.runtimes = obj.runtimes;
    this.permissions =[];
    Object.entries(obj.layerVersionsMap).forEach(([key, value]) => {
      this.permissions = obj.layerVersionsMap[key];
      this.versionsMap.set(Number(key),this.permissions);
    });

  }

   getVersion(version : number) : LayerVersionMetadata{
    const obj : LayerVersionMetadata = {
      permissions : this.versionsMap.get(version),
    };
    return obj;
  }

   listVersions() : number[] {
    return Array.from(this.versionsMap.keys());
  }

}

export const layerMetadataFactory : LayerMetadataFactory = (obj : Object) : LayerMetadata => {
  const layerState : LayerState = new LayerState(obj);
  return layerState;
};

