import { FeatureFlags } from 'amplify-cli-core';
import { AmplifyCLIFeatureFlagAdapter } from '../../graphql-transformer/amplify-cli-feature-flag-adapter';

jest.mock('amplify-cli-core');

describe('AmplifyCLIFeatureFlagAdapter', () => {
  const ff = new AmplifyCLIFeatureFlagAdapter();
  const transformerFeatureFlagPrefix = 'graphQLTransformer';

  describe('getBoolean', () => {
    test('test getBoolean to return default value', () => {
      (<any>FeatureFlags.getBoolean).mockReturnValue(true);
      const flagName = 'testFlag';
      expect(ff.getBoolean(flagName, true)).toEqual(true);
      expect(FeatureFlags.getBoolean).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });

    test('test getBoolean should return defaultValue when the FF throw error', () => {
      (<any>FeatureFlags.getBoolean).mockImplementation(() => {
        throw new Error('Error');
      });
      const flagName = 'testFlag';
      expect(ff.getBoolean(flagName, true)).toEqual(true);
      expect(FeatureFlags.getBoolean).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });

    test('test getBoolean should throw error when defaultValue is missing and the FF throw error', () => {
      (<any>FeatureFlags.getBoolean).mockImplementation(() => {
        throw new Error('Error');
      });
      const flagName = 'testFlag';
      expect(() => ff.getBoolean(flagName)).toThrowError();
      expect(FeatureFlags.getBoolean).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });
  });

  describe('getString', () => {
    test('test getString to return default value', () => {
      const expectedValue = 'StrValue';
      (<any>FeatureFlags.getString).mockReturnValue(expectedValue);
      const flagName = 'testFlag';
      expect(ff.getString(flagName, 'some other value')).toEqual(expectedValue);
      expect(FeatureFlags.getString).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });

    test('test getString should return defaultValue when the FF throw error', () => {
      (<any>FeatureFlags.getString).mockImplementation(() => {
        throw new Error('Error');
      });
      const flagName = 'testFlag';
      const expectedValue = 'StrValue';
      expect(ff.getString(flagName, expectedValue)).toEqual(expectedValue);
      expect(FeatureFlags.getString).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });

    test('test getString should throw error when defaultValue is missing and the FF throw error', () => {
      (<any>FeatureFlags.getString).mockImplementation(() => {
        throw new Error('Error');
      });
      const flagName = 'testFlag';
      expect(() => ff.getString(flagName)).toThrowError();
      expect(FeatureFlags.getString).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });
  });

  describe('getNumber', () => {
    test('test getNumber to return default value', () => {
      const expectedValue = 22;
      (<any>FeatureFlags.getNumber).mockReturnValue(expectedValue);
      const flagName = 'testFlag';
      expect(ff.getNumber(flagName, 12)).toEqual(expectedValue);
      expect(FeatureFlags.getNumber).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });

    test('test getNumber should return defaultValue when the FF throw error', () => {
      (<any>FeatureFlags.getNumber).mockImplementation(() => {
        throw new Error('Error');
      });
      const flagName = 'testFlag';
      const expectedValue = 44;
      expect(ff.getNumber(flagName, expectedValue)).toEqual(expectedValue);
      expect(FeatureFlags.getNumber).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });

    test('test getNumber should throw error when defaultValue is missing and the FF throw error', () => {
      (<any>FeatureFlags.getNumber).mockImplementation(() => {
        throw new Error('Error');
      });
      const flagName = 'testFlag';
      expect(() => ff.getNumber(flagName)).toThrowError();
      expect(FeatureFlags.getNumber).toHaveBeenCalledWith(`${transformerFeatureFlagPrefix}.${flagName}`);
    });
  });
});
