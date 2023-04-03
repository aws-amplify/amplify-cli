import { $TSAny, $TSContext, CLISubCommandType, IAmplifyResource } from 'amplify-cli-core';
import { S3PermissionType } from '../service-walkthrough-types/s3-user-input-types';
import { S3CFNDependsOn } from '../service-walkthroughs/s3-user-input-state';
import { AmplifyBuildParamsPermissions, AmplifyCfnParamType, AmplifyS3ResourceInputParameters } from './types';
export declare const transformS3ResourceStack: (context: $TSContext, resource: IAmplifyResource) => Promise<void>;
export declare class AmplifyS3ResourceStackTransform {
    private app;
    private cliInputs;
    private resourceTemplateObj;
    private cliInputsState;
    private cfn;
    private cfnInputParams;
    private context;
    private resourceName;
    constructor(resourceName: string, context: $TSContext);
    getCFN(): string | undefined;
    getCFNInputParams(): AmplifyS3ResourceInputParameters;
    transform(commandType: CLISubCommandType): Promise<void>;
    getS3DependsOn(): S3CFNDependsOn[] | undefined;
    generateCfnInputParameters: () => void;
    _getAuthGuestListPermission: (checkOperation: S3PermissionType, authPermissions: Array<S3PermissionType> | undefined) => AmplifyBuildParamsPermissions;
    _getPublicPrivatePermissions: (authPermissions: Array<S3PermissionType> | undefined, excludeListBuckets: boolean) => AmplifyBuildParamsPermissions | string;
    _getUploadPermissions: (authPermissions: Array<S3PermissionType> | undefined) => AmplifyBuildParamsPermissions | string;
    applyOverrides: () => Promise<void>;
    saveBuildFiles: (commandType: CLISubCommandType) => void;
    generateStack(context: $TSContext): Promise<void>;
    _addOutputs: () => void;
    _addParameters: () => void;
    _setCFNParams: (paramDefinitions: AmplifyCfnParamType) => void;
    _saveFilesToLocalFileSystem: (fileName: string, data: $TSAny) => void;
    _saveDependsOnToBackendConfig: () => void;
}
//# sourceMappingURL=s3-stack-transform.d.ts.map