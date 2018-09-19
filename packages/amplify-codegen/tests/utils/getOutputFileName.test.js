const getOutputFileName = require('../../src/utils/getOutputFileName');

describe('getOutputFileName', () => {
  it('should return the file name with by adding extension based on the language target', () => {
    expect(getOutputFileName('Foo', 'typescript')).toEqual('Foo.ts');
  });

  it('should not add extension if the file extension is already present', () => {
    expect(getOutputFileName('Foo.swift', 'swift')).toEqual('Foo.swift');
  });

  it('should not add any extension if the code generation target is unknown', () => {
    expect(getOutputFileName('Foo', 'bar')).toEqual('Foo');
  });
});
