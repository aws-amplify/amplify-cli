import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';

export class BaseStack extends cdk.Stack {
    protected parameters: Map<string, cdk.CfnParameter>;
    protected resources: Map<string, cdk.CfnResource>;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.parameters = new Map();
        this.resources = new Map();
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