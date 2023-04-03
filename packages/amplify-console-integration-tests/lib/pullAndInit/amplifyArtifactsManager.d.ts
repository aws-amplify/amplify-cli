import { $TSAny } from 'amplify-cli-core';
export declare const removeDotConfigDir: (projectRootDirPath: string) => void;
export declare const removeFilesForTeam: (projectRootDirPath: string) => void;
export declare const removeFilesForThirdParty: (projectRootDirPath: string) => void;
export declare const checkAmplifyFolderStructure: (projectRootDirPath: string) => boolean;
export declare const getTeamProviderInfo: (projectRootDirPath: string) => $TSAny;
export declare const getProjectConfig: (projectRootDirPath: string) => $TSAny;
