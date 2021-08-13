import { mapTableObject, unmarshall } from '../../../../data-loader/dynamo-db/utils';

describe('mapTableObject', () => {
  it(`will returns mapped TableName key object`, () => {
    expect(mapTableObject({ TestTable: { id: { S: '1' } }, OtherTable: { id: { S: '2' } } }, item => unmarshall(item))).toEqual({
      TestTable: { id: '1' },
      OtherTable: { id: '2' },
    });
  });
});
