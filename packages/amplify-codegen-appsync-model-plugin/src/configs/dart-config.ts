export const LOADER_CLASS_NAME = 'ModelProvider';
export const BASE_IMPORT_PACKAGES = [
  'package:flutter/foundation.dart',
  'package:amplify_datastore_plugin_interface/amplify_datastore_plugin_interface.dart'
];
export const COLLECTION_PACKAGE = 'package:collection/collection.dart';

export const typeToEnumMap: { [name: string] : string} = {
  String: 'string',
  Int: 'int',
  Float: 'double',
  Boolean: 'bool',
  AWSDate: 'date',
  AWSDateTime: 'dateTime',
  AWSTime: 'time',
  AWSTimestamp: 'timestamp',
};