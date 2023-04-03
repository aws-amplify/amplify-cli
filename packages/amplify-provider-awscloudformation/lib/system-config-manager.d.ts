import { $TSAny, $TSContext } from 'amplify-cli-core';
import { AwsSdkConfig } from './utils/auth-types';
export declare const setProfile: (awsConfigInfo: $TSAny, profileName: string) => void;
export declare const getProfiledAwsConfig: (context: $TSContext, profileName: string, isRoleSourceProfile?: boolean) => Promise<AwsSdkConfig>;
export declare const resetCache: (context: $TSContext, profileName: string) => Promise<$TSAny>;
export declare const getProfileCredentials: (profileName: string) => $TSAny;
export declare const getProfileRegion: (profileName: string) => string;
export declare const getNamedProfiles: () => $TSAny;
//# sourceMappingURL=system-config-manager.d.ts.map