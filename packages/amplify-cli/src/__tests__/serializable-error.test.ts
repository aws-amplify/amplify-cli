import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as os from 'os';
import { DetailedSerializableError, SerializableError } from '../domain/amplify-usageData/SerializableError';

describe('test serializabe error', () => {
  it('SerializableError only includes the error name and code', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error message',
      details: 'test error details',
      resolution: 'test error resolution',
      code: 'ResourceNotFoundException',
    });
    const serializableError = new SerializableError(error);
    expect(JSON.parse(JSON.stringify(serializableError))).toEqual({ name: 'NotImplementedError', code: 'ResourceNotFoundException' });
  });

  it('SerializableError only includes the error name when there is no error code', () => {
    const error = new Error('test error');
    const serializableError = new SerializableError(error);
    expect(JSON.parse(JSON.stringify(serializableError))).toEqual({ name: 'Error' });
  });

  it('SerializableError replaces ARNs in the error code', () => {
    const error = Object.assign(new Error('test error'), { code: 'arn:aws:service:region:account-id:resource/name' });
    const serializableError = new SerializableError(error);
    expect(serializableError.code).toBe('<escaped ARN>');
  });

  it('SerializableError does not include an error code that is not a string', () => {
    const error = Object.assign(new Error('test error'), { code: 42 });
    const serializableError = new SerializableError(error);
    expect(JSON.parse(JSON.stringify(serializableError))).toEqual({ name: 'Error' });
  });

  it('test DetailedSerializableError with regular stack trace', () => {
    const error = new Error('test error');
    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.name).toBe('Error');
    expect(serializableError.trace).toBeDefined();
    serializableError.trace?.forEach((trace) => {
      expect(trace.file).not.toContain(os.homedir());
    });
  });

  it('test DetailedSerializableError with custom stack trace', () => {
    const error = new Error('test error without stack');
    error.stack = 'nothing';
    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.name).toBe('Error');
    expect(serializableError.trace).toBeDefined();
    serializableError.trace?.forEach((trace) => {
      expect(trace.file).not.toContain(os.homedir());
    });
  });

  it('test DetailedSerializableError with error details that does not have AWS ARNs', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error without stack',
      details: 'some error details',
    });
    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.name).toBe('NotImplementedError');
    expect(serializableError.details).toBe('some error details');
  });

  it('test DetailedSerializableError with error details that has one AWS ARN', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error without stack',
      details: 'some error details with arn: arn:aws:service:region:account-id:resource/name and something else',
    });
    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.name).toBe('NotImplementedError');
    expect(serializableError.details).toBe('some error details with arn: <escaped ARN> and something else');
  });

  it('test DetailedSerializableError with error details that has two AWS ARNs', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error without stack',
      details:
        'some error details with arn: arn:aws-cn:service:::resource/name and arn: arn:aws-iso:service:region::res and something else',
    });
    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.name).toBe('NotImplementedError');
    expect(serializableError.details).toBe('some error details with arn: <escaped ARN> and arn: <escaped ARN> and something else');
  });

  it('test DetailedSerializableError has no stack arns in error message', () => {
    const testStack = 'amplify-someStackName-dev-u9910';
    const error = new AmplifyError('NotImplementedError', {
      message: `Could not initialize ${testStack}`,
    });

    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.message).toBe('Could not initialize <escaped stack>');
  });

  it('test DetailedSerializableError error message has no home directories in file paths', () => {
    const error = new AmplifyError('FileSystemPermissionsError', {
      message: `Permission denied, open '${os.homedir()}/.amplify/logs/amplify-cli-10371230.log`,
    });

    const serializableError = new DetailedSerializableError(error);
    expect(serializableError.message).not.toContain(os.homedir());
  });
});
