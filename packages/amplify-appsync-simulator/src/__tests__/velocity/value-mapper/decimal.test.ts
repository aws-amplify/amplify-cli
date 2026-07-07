import { JavaDecimal } from '../../../velocity/value-mapper/decimal';

describe('JavaDecimal', () => {
  it('valueOf()', () => {
    const val1 = new JavaDecimal(5) as any;
    const val2 = new JavaDecimal(3.14159) as any;

    expect(val1 + val2).toEqual(8.14159);
  });

  it('toJSON()', () => {
    const val = new JavaDecimal(4.2);

    expect(val.toJSON()).toEqual(4.2);
    expect(JSON.stringify(val)).toEqual('4.2');
  });

  it('toString()', () => {
    const val = new JavaDecimal(-10.3);

    expect(val.toString()).toEqual('-10.3');
    expect(val + '').toEqual('-10.3');
  });
});
