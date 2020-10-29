import { AppSyncServiceConfiguration } from "./add";

export interface UpdateApiRequest {
  version: 1;
  serviceModification: AppSyncServiceModification;
}

export type AppSyncServiceModification = Pick<AppSyncServiceConfiguration, 'serviceName'> & Partial<Pick<AppSyncServiceConfiguration, 'transformSchema' | 'defaultAuthType' | 'additionalAuthTypes' | 'conflictResolution'>>
