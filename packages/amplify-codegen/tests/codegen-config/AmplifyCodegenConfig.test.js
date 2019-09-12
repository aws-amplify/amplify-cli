const AmplifyCodeGenConfig = require('../../src/codegen-config/AmplifyCodeGenConfig');

describe('AmplifyCodeGenConfig', () => {
  describe('normalizePath', () => {
    let winPathConfig;

    beforeEach(() => {
      winPathConfig = {
        schemaPath: 'foo\\schema.graphql',
        includes: ['foo\\**\\*.grpahql'],
        excludes: ['bar\\**\\*.grpahql'],
        extensions: {
          amplify: {
            generatedFileName: 'src\\api.ts',
            docsFilePath: 'src\\graphql\\',
          },
        },
      };
    });
    it('should convert windows style path to unix style path', () => {
      const normalizedConfig = AmplifyCodeGenConfig.normalizePath(winPathConfig);
      expect(normalizedConfig.schemaPath).toEqual('foo/schema.graphql');
      expect(normalizedConfig.includes).toEqual(['foo/**/*.grpahql']);
      expect(normalizedConfig.excludes).toEqual(['bar/**/*.grpahql']);
      expect(normalizedConfig.extensions.amplify.generatedFileName).toEqual('src/api.ts');
      expect(normalizedConfig.extensions.amplify.docsFilePath).toEqual('src/graphql/');
    });

    it('should handle config where generatedFileName is missing', () => {
      delete winPathConfig.extensions.amplify.generatedFileName;
      const normalizedConfig = AmplifyCodeGenConfig.normalizePath(winPathConfig);
      expect(normalizedConfig.schemaPath).toEqual('foo/schema.graphql');
      expect(normalizedConfig.includes).toEqual(['foo/**/*.grpahql']);
      expect(normalizedConfig.excludes).toEqual(['bar/**/*.grpahql']);
      expect(normalizedConfig.extensions.amplify.generatedFileName).toBeUndefined();
      expect(normalizedConfig.extensions.amplify.docsFilePath).toEqual('src/graphql/');
    });
  });
});
