import { Converter } from 'aws-sdk/clients/dynamodb';
import { DynamoDBSet } from 'aws-sdk/lib/dynamodb/set';

import { toJSON } from '../value-mapper/to-json';

export const dynamodbUtils = {
  toDynamoDB(value: any) {
    return Converter.input(toJSON(value));
  },
  $toSet(values, fn = value => value) {
    return this.toDynamoDB(new DynamoDBSet([].concat(values).map(value => fn(value))));
  },
  toDynamoDBJson(value) {
    return JSON.stringify(this.toDynamoDB(value));
  },
  toString(value) {
    return this.toDynamoDB(String(value));
  },
  toStringJson(value) {
    return this.toDynamoDBJson(value);
  },
  toStringSet(value) {
    return this.$toSet(value, String);
  },
  toStringSetJson(value) {
    return JSON.stringify(this.toStringSet(value));
  },
  toNumber(value) {
    return this.toDynamoDB(Number(value));
  },
  toNumberJson(value) {
    return JSON.stringify(this.toNumber(value));
  },
  toNumberSet(value) {
    return this.$toSet(value, Number);
  },
  toNumberSetJson(value) {
    return JSON.stringify(this.toNumberSet(value));
  },
  toBinary(value) {
    return { B: toJSON(value) };
  },
  toBinaryJson(value) {
    // this is probably wrong.
    return JSON.stringify(this.toBinary(value));
  },
  toBinarySet(value) {
    return { BS: [].concat(value) };
  },
  toBinarySetJson(value) {
    return JSON.stringify(this.toBinarySet(value));
  },
  toBoolean(value) {
    return { BOOL: value };
  },
  toBooleanJson(value) {
    return JSON.stringify(this.toBoolean(value));
  },
  toNull() {
    return { NULL: null };
  },
  toNullJson() {
    return JSON.stringify(this.toNull());
  },
  toList(value) {
    return this.toDynamoDB(value);
  },
  toListJson(value) {
    return JSON.stringify(this.toList(value));
  },
  toMap(value) {
    // this should probably do some kind of conversion.
    return this.toDynamoDB(toJSON(value));
  },
  toMapJson(value) {
    return JSON.stringify(this.toMap(value));
  },
  toMapValues(values) {
    return Object.entries(toJSON(values)).reduce(
      (sum, [key, value]) => ({
        ...sum,
        [key]: this.toDynamoDB(value),
      }),
      {},
    );
  },
  toMapValuesJson(values) {
    return JSON.stringify(this.toMapValues(values));
  },
  toS3ObjectJson() {
    throw new Error('not implemented');
  },
  toS3Object() {
    throw new Error('not implemented');
  },
  fromS3ObjectJson() {
    throw new Error('not implemented');
  },
};
