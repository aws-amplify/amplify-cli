import { $TSAny, $TSContext, AmplifyCategoryTransform, Template } from '@aws-amplify/amplify-cli-core';
export type UserPoolGroupMetadata = {
    groupName: string;
    precedence: number;
    customPolicies?: $TSAny;
};
export type AmplifyUserPoolGroupStackOptions = {
    groups: UserPoolGroupMetadata[];
    identityPoolName?: string;
    cognitoResourceName: string;
};
export declare class AmplifyUserPoolGroupTransform extends AmplifyCategoryTransform {
    private _app;
    private _userPoolGroupTemplateObj;
    private _synthesizer;
    private _synthesizerOutputs;
    private __userPoolGroupTemplateObjOutputs;
    private _authResourceName;
    private _category;
    private _service;
    private _cliInputs;
    private _resourceName;
    constructor(resourceName: string);
    transform(context: $TSContext): Promise<Template>;
    private generateStackResources;
    applyOverride: () => Promise<void>;
    private generateStackProps;
    synthesizeTemplates: () => Promise<Template>;
    saveBuildFiles: (__context: $TSContext, template: Template) => Promise<void>;
    private writeBuildFiles;
}
//# sourceMappingURL=user-pool-group-stack-transform.d.ts.map