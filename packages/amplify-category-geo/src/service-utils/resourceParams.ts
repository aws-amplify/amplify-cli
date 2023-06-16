import { ProviderContext } from '@aws-amplify/amplify-cli-core';

/**
 * Parameters common to geo resources
 */
export type ResourceParameters = {
  providerContext: ProviderContext;
  name: string;
  accessType: AccessType;
  isDefault: boolean;
  dataProvider: DataProvider;
};

export enum AccessType {
  AuthorizedUsers = 'AuthorizedUsers',
  AuthorizedAndGuestUsers = 'AuthorizedAndGuestUsers',
  CognitoGroups = 'CognitoGroups',
}

export enum DataProvider {
  Esri = 'Esri',
  Here = 'HERE',
  OpenData = 'OpenData',
}
