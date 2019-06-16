import { Fn, Refs } from 'cloudform-types';
import { ResourceConstants } from 'graphql-transformer-common';

export function lambdaArnResource(name: string, region?: string) {
    const substitutions = {};
    if (referencesEnv(name)) {
        substitutions['env'] = Fn.Ref(ResourceConstants.PARAMETERS.Env)
    }
    return Fn.If(
        ResourceConstants.CONDITIONS.HasEnvironmentParameter,
        Fn.Sub(
            lambdaArnKey(name, region),
            substitutions
        ),
        Fn.Sub(
            lambdaArnKey(removeEnvReference(name), region),
            {}
        ),
    )
}

export function lambdaArnKey(name: string, region?: string) {
    return region ?
        `arn:aws:lambda:${region}:\${AWS::AccountId}:function:${name}` :
        `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:${name}`;
}

function referencesEnv(value: string) {
    return value.match(/(\${env})/) !== null;
}

function removeEnvReference(value: string) {
    return value.replace(/(-\${env})/, '');
}