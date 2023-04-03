/// <reference types="node" />
export { getCLIPath, isCI, npmInstall, createNewProjectDir } from '@aws-amplify/amplify-e2e-core';
export declare function deleteProjectDir(projectDirpath: string): void;
export declare function getProfileName(): string;
export declare function readJsonFileSync(jsonFilePath: string, encoding?: BufferEncoding): any;
