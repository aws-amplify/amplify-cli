import * as os from 'os';
import { SerializableError } from '../domain/amplify-usageData/SerializableError';

describe('test serializabe error', () => {
  it('test SerializableError', () => {
    const error = new Error('test error');
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('Error');
    expect(serializableError.trace).toBeDefined();
    serializableError.trace?.forEach(trace => {
      expect(trace.file).not.toContain(os.homedir());
    });
  });

  it('test SerializableError', () => {
    const error = new Error('test error without stack');
    error.stack = 'nothing';
    const serializableError = new SerializableError(error);
    expect(serializableError.name).toBe('Error');
    expect(serializableError.trace).toBeDefined();
    serializableError.trace?.forEach(trace => {
      expect(trace.file).not.toContain(os.homedir());
    });
  });
});
