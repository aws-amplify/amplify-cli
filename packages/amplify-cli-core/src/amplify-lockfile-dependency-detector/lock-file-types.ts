/**
 * lock file type
 */
export enum LockfileType {
    NPM = 'npm',
    YARN = 'yarn',
}

/**
* package.json type
*/
export type PkgJsonType = {
    name : string,
    version: string,
    dependencies: Record<string, string>,
    devDependencies?: Record<string, string>
}
