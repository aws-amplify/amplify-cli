import { graphqlName, toUpper, toCamelCase, simplifyName } from './util';
import { DEFAULT_SCALARS } from './definition';

export class ModelResourceIDs {
  static ModelTableResourceID(typeName: string): string {
    return `${typeName}Table`;
  }
  static ModelTableStreamArn(typeName: string): string {
    return `${typeName}TableStreamArn`;
  }
  static ModelTableDataSourceID(typeName: string): string {
    return `${typeName}DataSource`;
  }
  static ModelTableIAMRoleID(typeName: string): string {
    return `${typeName}IAMRole`;
  }
  static ModelFilterInputTypeName(name: string): string {
    const nameOverride = DEFAULT_SCALARS[name];
    if (nameOverride) {
      return `Model${nameOverride}FilterInput`;
    }
    return `Model${name}FilterInput`;
  }
  static ModelFilterScalarInputTypeName(name: string, includeFilter: Boolean): string {
    const nameOverride = DEFAULT_SCALARS[name];
    if (nameOverride) {
      return `Model${nameOverride}${includeFilter ? 'Filter' : ''}Input`;
    }
    return `Model${name}${includeFilter ? 'Filter' : ''}Input`;
  }
  static ModelConditionInputTypeName(name: string): string {
    const nameOverride = DEFAULT_SCALARS[name];
    if (nameOverride) {
      return `Model${nameOverride}ConditionInput`;
    }
    return `Model${name}ConditionInput`;
  }
  static ModelKeyConditionInputTypeName(name: string): string {
    const nameOverride = DEFAULT_SCALARS[name];
    if (nameOverride) {
      return `Model${nameOverride}KeyConditionInput`;
    }
    return `Model${name}KeyConditionInput`;
  }
  static ModelCompositeKeyArgumentName(keyFieldNames: string[]) {
    return toCamelCase(keyFieldNames.map(n => graphqlName(n)));
  }
  static ModelCompositeKeySeparator() {
    return '#';
  }
  static ModelCompositeAttributeName(keyFieldNames: string[]) {
    return keyFieldNames.join(ModelResourceIDs.ModelCompositeKeySeparator());
  }
  static ModelCompositeKeyConditionInputTypeName(modelName: string, keyName: string): string {
    return `Model${modelName}${keyName}CompositeKeyConditionInput`;
  }
  static ModelCompositeKeyInputTypeName(modelName: string, keyName: string): string {
    return `Model${modelName}${keyName}CompositeKeyInput`;
  }
  static ModelFilterListInputTypeName(name: string, includeFilter: Boolean): string {
    const nameOverride = DEFAULT_SCALARS[name];
    if (nameOverride) {
      return `Model${nameOverride}List${includeFilter ? 'Filter' : ''}Input`;
    }
    return `Model${name}List${includeFilter ? 'Filter' : ''}Input`;
  }

  static ModelScalarFilterInputTypeName(name: string, includeFilter: Boolean): string {
    const nameOverride = DEFAULT_SCALARS[name];
    if (nameOverride) {
      return `Model${nameOverride}${includeFilter ? 'Filter' : ''}Input`;
    }
    return `Model${name}${includeFilter ? 'Filter' : ''}Input`;
  }
  static ModelConnectionTypeName(typeName: string): string {
    return `Model${typeName}Connection`;
  }
  static ModelDeleteInputObjectName(typeName: string): string {
    return graphqlName('Delete' + toUpper(typeName) + 'Input');
  }
  static ModelUpdateInputObjectName(typeName: string): string {
    return graphqlName('Update' + toUpper(typeName) + 'Input');
  }
  static ModelCreateInputObjectName(typeName: string): string {
    return graphqlName(`Create` + toUpper(typeName) + 'Input');
  }
  static ModelOnCreateSubscriptionName(typeName: string): string {
    return graphqlName(`onCreate` + toUpper(typeName));
  }
  static ModelOnUpdateSubscriptionName(typeName: string): string {
    return graphqlName(`onUpdate` + toUpper(typeName));
  }
  static ModelOnDeleteSubscriptionName(typeName: string): string {
    return graphqlName(`onDelete` + toUpper(typeName));
  }
  static ModelAttributeTypesName(): string {
    return `ModelAttributeTypes`;
  }
  static ModelSizeInputTypeName(): string {
    return `ModelSizeInput`;
  }
  static NonModelInputObjectName(typeName: string): string {
    return graphqlName(toUpper(typeName) + 'Input');
  }
  static UrlParamsInputObjectName(typeName: string, fieldName: string) {
    return graphqlName(toUpper(typeName) + toUpper(fieldName) + 'ParamsInput');
  }
  static HttpQueryInputObjectName(typeName: string, fieldName: string) {
    return graphqlName(toUpper(typeName) + toUpper(fieldName) + 'QueryInput');
  }
  static HttpBodyInputObjectName(typeName: string, fieldName: string) {
    return graphqlName(toUpper(typeName) + toUpper(fieldName) + 'BodyInput');
  }
}
