export interface S3ServiceConfigurationBase {
    serviceName: 'S3';
}
export interface S3Permissions {
    auth: CrudOperation[];
    guest?: CrudOperation[];
    groups?: PermissionGroups;
}
export interface PermissionGroups {
    [k: string]: CrudOperation[];
}
export interface LambdaTriggerConfig {
    mode: 'new' | 'existing';
    name: string;
}
export declare enum CrudOperation {
    CREATE_AND_UPDATE = "CREATE_AND_UPDATE",
    READ = "READ",
    DELETE = "DELETE"
}
//# sourceMappingURL=base.d.ts.map