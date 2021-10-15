import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { $TSObject } from 'amplify-cli-core';

export type TemplateMappings = {
    RegionMapping: $TSObject
};

export class BaseStack extends cdk.Stack {
    protected parameters: Map<string, cdk.CfnParameter>;
    protected regionMapping: cdk.CfnMapping;

    constructor(scope: cdk.Construct, id: string, props:TemplateMappings) {
        super(scope, id);
        this.parameters = new Map();

        this.regionMapping = new cdk.CfnMapping(this, 'RegionMapping', {
            mapping: props.RegionMapping
        });
    }

    // construct the stack CFN input parameters
    constructInputParameters(parameterNames: Array<string>): Map<string, cdk.CfnParameter> {
        let parametersMap: Map<string, cdk.CfnParameter> = new Map();
        parameterNames.forEach(parameterName => {
            const inputParameter = new cdk.CfnParameter(this, parameterName, { type: 'String' })
            parametersMap.set(parameterName, inputParameter);
        });
        return parametersMap;
    }

    toCloudFormation() {
        prepareApp(this);
        const cfn = this._toCloudFormation();
        return cfn;
    }
}
