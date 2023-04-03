/// <reference types="node" />
export declare const encryptBuffer: (text: Buffer, passKey: string) => Promise<string>;
export declare const encryptKey: (key: string) => Promise<string>;
export declare const createHashedIdentifier: (projectName: string, appId: string, envName: string | undefined) => {
    projectIdentifier: string;
    projectEnvIdentifier: string;
};
//# sourceMappingURL=encryption-helpers.d.ts.map