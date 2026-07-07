import { JavaInteger } from '../../../velocity/value-mapper/integer';
import { JavaString } from '../../../velocity/value-mapper/string';

describe('JavaInteger', () => {
  it('valueOf()', () => {
    const val1 = new JavaInteger(5) as any;
    const val2 = new JavaInteger(3.14159) as any;

    expect(val1 + val2).toEqual(8);
  });

  it('toJSON()', () => {
    const val = new JavaInteger(42);

    expect(val.toJSON()).toEqual(42);
    expect(JSON.stringify(val)).toEqual('42');
  });

  it('toString()', () => {
    const val = new JavaInteger(55);

    expect(val.toString()).toEqual('55');
    expect(val + '').toEqual('55');
  });

  it('parseInt()', () => {
    const val = new JavaInteger(1);

    expect(val.parseInt('15').valueOf()).toEqual(15);
    expect(val.parseInt('f', 16).valueOf()).toEqual(15);
    expect(val.parseInt(new JavaInteger(99)).valueOf()).toEqual(99);
    expect(val.parseInt(new JavaString('123')).valueOf()).toEqual(123);
    expect(val.parseInt(new JavaString('e'), new JavaInteger(16)).valueOf()).toEqual(14);
  });
});
