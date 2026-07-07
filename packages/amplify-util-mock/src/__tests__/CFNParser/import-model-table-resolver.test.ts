import { importModelTableResolver } from '../../CFNParser/import-model-table-resolver';

describe('import model table resolver', () => {
  it('replaces matched imports', () => {
    expect(importModelTableResolver('1234:GetAtt:MyModelTable:Name', 'dev')).toEqual('MyModel-1234-dev');
  });

  it('identity function if no match', () => {
    expect(importModelTableResolver('not a match', 'dev')).toEqual('not a match');
  });
});
