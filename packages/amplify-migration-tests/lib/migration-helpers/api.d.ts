import { AddApiOptions } from '@aws-amplify/amplify-e2e-core';
/**
 * Old Dx prior to this api workflow change https://github.com/aws-amplify/amplify-cli/pull/8153
 */
export declare function addApiWithoutSchemaOldDx(cwd: string, opts?: Partial<AddApiOptions>): Promise<void>;
export declare function addApiWithSchemaAndConflictDetectionOldDx(cwd: string, schemaFile: string): Promise<void>;
export declare function addRestApiOldDx(cwd: string, settings: any): Promise<void>;
