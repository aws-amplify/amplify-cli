import { AppSyncServiceConfiguration } from './add';

export interface UpdateApiRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * Service modifications that will be interpreted by Amplify.
   */
  serviceModification: AppSyncServiceModification;
}

/**
 * A subset of the AppSyncServiceConfiguration that are mutable.
 */
export type AppSyncServiceModification = Pick<AppSyncServiceConfiguration, 'serviceName'> &
  Partial<Pick<AppSyncServiceConfiguration, 'transformSchema' | 'defaultAuthType' | 'additionalAuthTypes' | 'conflictResolution'>>;
