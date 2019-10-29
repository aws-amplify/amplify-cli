import { GraphQLType, isInputObjectType, getNamedType, isObjectType } from 'graphql';

const S3_FIELD_NAMES = ['bucket', 'key', 'region'];

export function hasS3Fields(input: GraphQLType): boolean {
  if (isObjectType(input) || isInputObjectType(input)) {
    if (isS3Field(input)) {
      return true;
    }
    const fields = input.getFields();
    return Object.keys(fields).some(f => hasS3Fields((<any>fields[f]) as GraphQLType));
  }
  return false;
}

export function isS3Field(field: GraphQLType): boolean {
  if (isObjectType(field) || isInputObjectType(field)) {
    const fields = field.getFields();
    const stringFields = Object.keys(fields).filter(f => {
      const typeName = getNamedType(fields[f].type);
      return typeName.name === 'String';
    });
    const isS3FileField = S3_FIELD_NAMES.every(fieldName => stringFields.includes(fieldName));
    if (isS3FileField) {
      return true;
    }
  }
  return false;
}
