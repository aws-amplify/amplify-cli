import { JavaString } from '../../../velocity/value-mapper/string';

describe('JavaString', () => {
  it('replaceAll', () => {
    const str = new JavaString('foo bar foo bar foo bar Foo')
    const replacedStr = str.replaceAll('foo', 'baz');
    expect(replacedStr.toString()).toEqual('baz bar baz bar baz bar Foo');
    expect(replacedStr.toIdString()).toEqual('baz bar baz bar baz bar Foo');
    expect(replacedStr.toJSON()).toEqual('baz bar baz bar baz bar Foo');
  })
});