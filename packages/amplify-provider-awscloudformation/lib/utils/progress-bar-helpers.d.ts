import { ItemPayload, ProgressPayload } from '@aws-amplify/amplify-prompts';
export declare const CFN_SUCCESS_STATUS: string[];
export declare const CNF_ERROR_STATUS: string[];
export declare const createItemFormatter: (payload: ItemPayload) => {
    renderString: string;
    color: string;
};
export type EventMap = {
    rootStackName: string;
    envName: string;
    projectName: string;
    rootResources: {
        key: string;
        category: string;
    }[];
    eventToCategories: Map<string, string>;
    categories: {
        name: string;
        size: number;
    }[];
};
export declare const createProgressBarFormatter: (payload: ProgressPayload, value: number, total: number) => string;
//# sourceMappingURL=progress-bar-helpers.d.ts.map