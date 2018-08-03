export class ModelResourceIDs {
    static ModelTableResourceID(typeName: string): string {
        return `${typeName}Table`
    }
    static ModelTableDataSourceID(typeName: string): string {
        return `${typeName}DataSource`
    }
    static ModelTableIAMRoleID(typeName: string): string {
        return `${typeName}IAMRole`
    }
}