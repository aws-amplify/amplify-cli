import { GraphQLType, isObjectType, isScalarType } from 'graphql';
import getType from './getType';
const S3_FIELD_NAMES = ['bucket', 'key', 'region'];
export default function isS3Object(typeObj: GraphQLType): boolean {
  if (isObjectType(typeObj)) {
    const fields = typeObj.getFields();
    const fieldName = typeObj.name;
    const hasS3Fields = S3_FIELD_NAMES.every(s3Field => {
      const field = fields[s3Field];
      try {
        const type = getType(field.type);
        return field && isScalarType(type) && type.name === 'String';
      } catch (e) {
        return false;
      }
    });
    return hasS3Fields && fieldName === 'S3Object';
  }
  return false;
}
