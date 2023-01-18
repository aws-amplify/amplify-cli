/**
 * lock file type
 */
export enum LockfileType {
    NPM = 'npm',
    YARN = 'yarn',
    YARN2 = 'yarn2',
}

/**
* package.json type
*/
export type PackageJson = {
    name : string,
    version: string,
    dependencies: Record<string, string>,
    devDependencies?: Record<string, string>,
    peerDependencies?: Record<string, string>
}
