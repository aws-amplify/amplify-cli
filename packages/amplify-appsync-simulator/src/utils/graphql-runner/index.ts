import { JWTToken } from '../auth-helpers/helpers';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';

export type AppSyncGraphQLExecutionContext = {
  readonly jwt?: JWTToken;
  readonly sourceIp?: string;
  headers: Record<string, string | string[]>;
  appsyncErrors?: Error[];
  requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType;
};
