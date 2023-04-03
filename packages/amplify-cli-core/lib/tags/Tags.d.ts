export interface Tag {
    Key: string;
    Value: string;
}
export declare function ReadTags(tagsFilePath: string): Tag[];
export declare function validate(tags: Tag[], skipProjectEnv?: boolean): void;
export declare function HydrateTags(tags: Tag[], tagVariables: TagVariables, skipProjectEnv?: boolean): Tag[];
type TagVariables = {
    envName: string;
    projectName: string;
};
export {};
//# sourceMappingURL=Tags.d.ts.map