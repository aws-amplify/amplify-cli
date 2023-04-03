import { Template } from 'cloudform';
import { Diff } from 'deep-diff';
export interface DiffableProject {
    stacks: {
        [stackName: string]: Template;
    };
    root: Template;
}
export type DiffChanges = Array<Diff<DiffableProject, DiffableProject>>;
interface GQLDiff {
    diff: DiffChanges;
    next: DiffableProject;
    current: DiffableProject;
}
export declare const getGQLDiff: (currentBackendDir: string, cloudBackendDir: string) => GQLDiff;
export declare function readFromPath(directory: string): any;
export {};
//# sourceMappingURL=utils.d.ts.map