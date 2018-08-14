import { graphqlName, toUpper } from './util'

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
    static ModelFilterInputTypeName(name: string): string {
        return `Model${name}FilterInput`
    }
    static ModelConnectionTypeName(typeName: string): string {
        return `Model${typeName}Connection`
    }
    static ModelDeleteInputObjectName(typeName: string): string {
        return graphqlName('Delete' + toUpper(typeName) + 'Input')
    }
    static ModelUpdateInputObjectName(typeName: string): string {
        return graphqlName('Update' + toUpper(typeName) + 'Input')
    }
    static ModelCreateInputObjectName(typeName: string): string {
        return graphqlName(`Create` + toUpper(typeName) + 'Input')
    }
}