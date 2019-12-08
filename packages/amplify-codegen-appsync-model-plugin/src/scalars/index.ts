import { NormalizedScalarsMap } from '@graphql-codegen/visitor-plugin-common';

export const JAVA_SCALAR_MAP: NormalizedScalarsMap = {
  ID: 'String',
  String: 'String',
  Int: 'Integer',
  Float: 'Float',
  Boolean: 'Boolean',
  AWSDate: 'java.util.Date',
  AWSDateTime: 'java.util.Date',
  AWSTime: 'java.sql.Time',
  AWSTimestamp: 'long',
  AWSEmail: 'String',
  AWSJSON: 'String',
  AWSURL: 'String',
  AWSPhone: 'String',
  AWSIPAddress: 'String',
};

export const SWIFT_SCALAR_MAP: NormalizedScalarsMap = {
  ID: 'String',
  String: 'String',
  Int: 'Int',
  Float: 'Double',
  Boolean: 'Bool',
  AWSDate: 'Date',
  AWSTime: 'Date',
  AWSDateTime: 'Date',
  AWSTimestamp: 'Int',
  AWSEmail: 'String',
  AWSJSON: 'String',
  AWSURL: 'String',
  AWSPhone: 'String',
  AWSIPAddress: 'String',
};

export const TYPESCRIPT_SCALAR_MAP: NormalizedScalarsMap = {
  ID: 'string',
  String: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  AWSDate: 'string',
  AWSDateTime: 'string',
  AWSTime: 'string',
  AWSTimestamp: 'number',
  AWSEmail: 'string',
  AWSJSON: 'string',
  AWSURL: 'string',
  AWSPhone: 'string',
  AWSIPAddress: 'string',
};

export const METADATA_SCALAR_MAP: NormalizedScalarsMap = {
  ID: 'ID',
  Boolean: 'Boolean',
  String: 'String',
  AWSDate: 'AWSDate',
  AWSTime: 'AWSTime',
  AWSDateTime: 'AWSDateTime',
  AWSEmail: 'AWSEmail',
  AWSJSON: 'AWSJSON',
  AWSURL: 'AWSURL',
  AWSPhone: 'AWSPhone',
  AWSIPAddress: 'AWSIPAddress',
  Int: 'Int',
  Float: 'Float',
  AWSTimestamp: 'AWSTimestamp',
};
