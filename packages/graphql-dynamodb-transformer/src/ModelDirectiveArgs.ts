export interface QueryNameMap {
    get?: string;
    list?: string;
    query?: string;
}

export interface MutationNameMap {
    create?: string;
    update?: string;
    delete?: string;
}

export type ModelSubscriptionLevel = 'off' | 'public' | 'on'

export interface SubscriptionNameMap {
    onCreate?: string[];
    onUpdate?: string[];
    onDelete?: string[];
    level?: ModelSubscriptionLevel;
}

export interface ModelDirectiveArgs {
    queries?: QueryNameMap,
    mutations?: MutationNameMap,
    subscriptions?: SubscriptionNameMap,
}