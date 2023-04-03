import { DeploymentSecrets } from '.';
export declare const mergeDeploymentSecrets: (deploymentSecretsModifier: deploymentSecretMerge) => DeploymentSecrets;
export declare const removeFromDeploymentSecrets: (deploymentSecretsModifier: deploymentSecretsRemove) => DeploymentSecrets;
type deploymentSecretMerge = deploymentSecretsRemove & {
    value: string;
};
type deploymentSecretsRemove = {
    currentDeploymentSecrets: DeploymentSecrets;
    category: string;
    rootStackId: string;
    envName: string;
    resource: string;
    keyName: string;
};
export {};
//# sourceMappingURL=deploymentSecretsHelper.d.ts.map