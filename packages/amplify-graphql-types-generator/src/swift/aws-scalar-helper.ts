import { GraphQLScalarType } from 'graphql';

interface INameToValueMap {
  [key: string]: any;
}

export const awsScalarMap: INameToValueMap = {
  AWSDate: 'String',
  AWSTime: 'String',
  AWSDateTime: 'String',
  AWSTimestamp: 'Int',
  AWSEmail: 'String',
  AWSJSON: 'String',
  AWSURL: 'String',
  AWSPhone: 'String',
  AWSIPAddress: 'String',
};

export function getTypeForAWSScalar(type: GraphQLScalarType): string {
  return awsScalarMap[type.name];
}
