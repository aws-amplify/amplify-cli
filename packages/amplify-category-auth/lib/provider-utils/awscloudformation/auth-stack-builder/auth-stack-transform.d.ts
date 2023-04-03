import { $TSAny, $TSContext, AmplifyCategoryTransform, Template } from '@aws-amplify/amplify-cli-core';
export declare class AmplifyAuthTransform extends AmplifyCategoryTransform {
    private _app;
    private _category;
    private _service;
    private _authTemplateObj;
    private _synthesizer;
    private _cliInputs;
    private _cognitoStackProps;
    constructor(resourceName: string);
    transform(context: $TSContext): Promise<Template>;
    private generateStackResources;
    applyOverride: () => Promise<void>;
    private generateStackProps;
    private synthesizeTemplates;
    saveBuildFiles: (context: $TSContext, template: Template) => Promise<void>;
    private writeBuildFiles;
    validateCfnParameters(context: $TSContext, oldParameters: $TSAny, parametersJson: $TSAny): boolean;
    private generateCfnOutputs;
    private addCfnParameters;
    private addCfnConditions;
}
//# sourceMappingURL=auth-stack-transform.d.ts.map