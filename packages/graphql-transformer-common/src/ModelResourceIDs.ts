import { graphqlName, toUpper } from './util'
import { DEFAULT_SCALARS } from './definition'

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
        const nameOverride = DEFAULT_SCALARS[name]
        if (nameOverride) {
            return `Model${nameOverride}FilterInput`
        }
        return `Model${name}FilterInput`
    }
    static ModelScalarFilterInputTypeName(name: string): string {
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
    static ModelOnCreateSubscriptionName(typeName: string): string {
        return graphqlName(`onCreate` + toUpper(typeName))
    }
    static ModelOnUpdateSubscriptionName(typeName: string): string {
        return graphqlName(`onUpdate` + toUpper(typeName))
    }
    static ModelOnDeleteSubscriptionName(typeName: string): string {
        return graphqlName(`onDelete` + toUpper(typeName))
    }
    static NonModelInputObjectName(typeName: string): string {
        return graphqlName(toUpper(typeName) + 'Input')
    }
}