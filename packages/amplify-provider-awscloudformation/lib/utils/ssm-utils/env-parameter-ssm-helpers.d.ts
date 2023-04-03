import { $TSContext } from 'amplify-cli-core';
export declare const getEnvParametersUploadHandler: (context: $TSContext) => Promise<(key: string, value: string | boolean | number) => Promise<void>>;
export declare const getEnvParametersDownloadHandler: (context: $TSContext) => Promise<(keys: string[]) => Promise<Record<string, string | number | boolean>>>;
//# sourceMappingURL=env-parameter-ssm-helpers.d.ts.map