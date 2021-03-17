import { Unauthorized, ValidateError, TemplateSentError } from './errors';
import autoId from 'uuid/v4';
import { JavaString } from '../value-mapper/string';
import { JavaArray } from '../value-mapper/array';
import { JavaMap } from '../value-mapper/map';
import jsStringEscape from 'js-string-escape';
import { GraphQLResolveInfo, FieldNode } from 'graphql';

export const generalUtils = {
  errors: [],
  quiet: () => '',
  qr: () => '',
  escapeJavaScript(value) {
    return jsStringEscape(value);
  },
  urlEncode(value) {
    // Stringent in adhering to RFC 3986 ( except the asterisk that appsync ingores to encode )
    return encodeURIComponent(value).replace(/[!'()]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  },
  urlDecode(value) {
    return decodeURIComponent(value);
  },
  base64Encode(value) {
    // eslint-disable-next-line
    return new Buffer(value).toString('base64');
  },
  base64Decode(value) {
    // eslint-disable-next-line
    return new Buffer(value, 'base64').toString('ascii');
  },
  parseJson(value) {
    return JSON.parse(value);
  },
  toJson(value) {
    return value !== undefined ? JSON.stringify(value) : JSON.stringify(null);
  },
  autoId() {
    return autoId();
  },
  unauthorized() {
    const err = new Unauthorized('Unauthorized', this.info);
    this.errors.push(err);
    throw err;
  },
  error(message, type = null, data = null, errorInfo = null) {
    data = filterData(this.info, data);
    const err = new TemplateSentError(message, type, data, errorInfo, this.info);
    this.errors.push(err);
    throw err;
  },
  appendError(message, type = null, data = null, errorInfo = null) {
    data = filterData(this.info, data);
    this.errors.push(new TemplateSentError(message, type, data, errorInfo, this.info));
    return '';
  },
  getErrors() {
    return this.errors;
  },
  validate(allGood, message, errorType, data) {
    if (allGood) return '';
    const error = new ValidateError(message, this.info, errorType, data);
    this.errors.push(error);
    throw error;
  },
  isNull(value) {
    return value === null || typeof value == 'undefined';
  },
  isNullOrEmpty(value) {
    if (this.isNull(value)) return true;

    if (value instanceof JavaMap) {
      return Object.keys(value.toJSON()).length == 0;
    }
    if (value instanceof JavaArray || value instanceof JavaString) {
      return value.toJSON().length == 0;
    }
    return !!value;
  },

  isNullOrBlank(value) {
    return this.isNullOrEmpty(value);
  },
  defaultIfNull(value, defaultValue = '') {
    if (value !== null && value !== undefined) return value;
    return defaultValue;
  },
  defaultIfNullOrEmpty(value, defaultValue) {
    if (value) return value;
    return defaultValue;
  },
  defaultIfNullOrBlank(value, defaultValue) {
    if (value) return value;
    return defaultValue;
  },
  isString(value) {
    return value instanceof JavaString;
  },
  isNumber(value) {
    return typeof value === 'number';
  },
  isBoolean(value) {
    return typeof value === 'boolean';
  },
  isList(value) {
    return Array.isArray(value) || value instanceof JavaArray;
  },
  isMap(value) {
    if (value instanceof Map) return value;
    return value != null && typeof value === 'object';
  },
  typeOf(value) {
    if (value === null) return 'Null';
    if (this.isList(value)) return 'List';
    if (this.isMap(value)) return 'Map';
    switch (typeof value) {
      case 'number':
        return 'Number';
      case 'string':
        return 'String';
      case 'boolean':
        return 'Boolean';
      default:
        return 'Object';
    }
  },
  matches(pattern, value) {
    return new RegExp(pattern).test(value);
  },
};

function filterData(info: GraphQLResolveInfo, data = null): any {
  if (data instanceof JavaMap) {
    var filteredData = {};
    // filter fields in data based on the query selection set
    info.operation.selectionSet.selections
      .map(selection => selection as FieldNode)
      .find(selection => selection.name.value === info.fieldName)
      .selectionSet.selections.map(fieldNode => (fieldNode as FieldNode).name.value)
      .forEach(field => (filteredData[field] = data.get(field)));
    data = filteredData;
  }
  return data;
}
