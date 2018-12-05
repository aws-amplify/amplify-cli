import { GraphQLType, isInputObjectType, getNamedType, isObjectType } from 'graphql';

const S3_FIELD_NAMES = ['bucket', 'key', 'region', 'localUri', 'mimeType'];

export function hasS3Fields(input: GraphQLType): boolean {
  if (isObjectType(input) || isInputObjectType(input)) {
    const fields = input.getFields();
    const stringFields = Object.keys(fields).filter(f => {
      const typeName = getNamedType(fields[f].type);
      return typeName.name === 'String';
    });
    const isS3FileField = S3_FIELD_NAMES.every(fieldName => stringFields.includes(fieldName));
    if (isS3FileField) {
      return true;
    }
    return Object.keys(fields)
      .filter(f => !stringFields.includes(f))
      .some(f => hasS3Fields((<any>fields[f]) as GraphQLType));
  }
  return false;
}
