export type ModelQuery = 'get' | 'list'
export type ModelMutation = 'create' | 'update' | 'delete'
export type ModelOperation = 'create' | 'update' | 'delete' | 'read'
export interface AuthRule {
    allow: 'owner' | 'groups';
    ownerField?: string;
    identityField?: string;
    groupsField?: string;
    groups?: string[];
    operations?: ModelOperation[]
    queries?: ModelQuery[]
    mutations?: ModelMutation[]
    groupClaim?: string;
}