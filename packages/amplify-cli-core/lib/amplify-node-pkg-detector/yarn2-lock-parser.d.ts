import { YarnLockDependencyType, YarnLock, YarnLockParser, YarnLockFileTypes } from './yarn-lock-parser';
export declare class Yarn2LockParser extends YarnLockParser {
    type: YarnLockFileTypes;
    dependenciesMap: Record<string, Record<string, YarnLockDependencyType>>;
    constructor();
    parseLockFile: (lockFileContents: string) => YarnLock;
    private convertToYarnParserKeys;
}
//# sourceMappingURL=yarn2-lock-parser.d.ts.map