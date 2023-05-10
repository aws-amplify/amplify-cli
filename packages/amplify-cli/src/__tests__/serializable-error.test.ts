import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as os from 'os';
import { SerializableError } from '../domain/amplify-usageData/SerializableError';

describe('test serializabe error', () => {
  it('test SerializableError with regular stack trace', () => {
    const error = new Error('test error');
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('Error');
    expect(serializableError.trace).toBeDefined();
    serializableError.trace?.forEach((trace) => {
      expect(trace.file).not.toContain(os.homedir());
    });
  });

  it('test SerializableError with custom stack trace', () => {
    const error = new Error('test error without stack');
    error.stack = 'nothing';
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('Error');
    expect(serializableError.trace).toBeDefined();
    serializableError.trace?.forEach((trace) => {
      expect(trace.file).not.toContain(os.homedir());
    });
  });

  it('test SerializableError with error details that does not have AWS ARNs', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error without stack',
      details: 'some error details',
    });
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('NotImplementedError');
    expect(serializableError.details).toBe('some error details');
  });

  it('test SerializableError with error details that has one AWS ARN', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error without stack',
      details: 'some error details with arn: arn:aws:service:region:account-id:resource/name and something else',
    });
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('NotImplementedError');
    expect(serializableError.details).toBe('some error details with arn: <escaped ARN> and something else');
  });

  it('test SerializableError with error details that has two AWS ARNs', () => {
    const error = new AmplifyError('NotImplementedError', {
      message: 'test error without stack',
      details:
        'some error details with arn: arn:aws-cn:service:::resource/name and arn: arn:aws-iso:service:region::res and something else',
    });
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('NotImplementedError');
    expect(serializableError.details).toBe('some error details with arn: <escaped ARN> and arn: <escaped ARN> and something else');
  });
});
