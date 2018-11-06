const getOutputFileName = require('../../src/utils/getOutputFileName');

describe('getOutputFileName', () => {
  it('should return the file name with by adding extension based on the language target', () => {
    expect(getOutputFileName('Foo', 'typescript')).toEqual('Foo.ts');
  });

  it('should not add extension if the file extension is already present', () => {
    expect(getOutputFileName('Foo.swift', 'swift')).toEqual('Foo.swift');
  });

  it('should add .service.ts extension when the target is angular', () => {
    expect(getOutputFileName('Foo', 'angular')).toEqual('Foo.service.ts');
  });

  it('should return api.service.ts when input name is missing and target is angular', () => {
    expect(getOutputFileName(null, 'angular')).toEqual('src/app/api.service.ts');
  });

  it('should not add any extension if the code generation target is unknown', () => {
    expect(getOutputFileName('Foo', 'bar')).toEqual('Foo');
  });
});
