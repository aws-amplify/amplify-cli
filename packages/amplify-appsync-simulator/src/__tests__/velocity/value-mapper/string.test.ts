import { JavaString } from '../../../velocity/value-mapper/string';

describe('JavaString', () => {
  it('replaceAll', () => {
    const str = new JavaString('foo bar foo bar foo bar Foo');
    const replacedStr = str.replaceAll('foo', 'baz');
    expect(replacedStr.toString()).toEqual('baz bar baz bar baz bar Foo');
    expect(replacedStr.toIdString()).toEqual('baz bar baz bar baz bar Foo');
    expect(replacedStr.toJSON()).toEqual('baz bar baz bar baz bar Foo');
  });

  it('length', () => {
    const str1 = new JavaString('foo');
    expect(str1.length()).toEqual(3);
  });

  it('concat', () => {
    const str1 = new JavaString('foo');
    expect(str1.concat(new JavaString('bar')).toString()).toEqual('foobar');
  });

  it('contains', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.contains(new JavaString('ipsum'))).toEqual(true);
    expect(str.contains(new JavaString('DOLOR'))).toEqual(false);
  });

  it('endsWith', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.endsWith(new JavaString('ipsum'))).toEqual(false);
    expect(str.endsWith(new JavaString('elit'))).toEqual(true);
  });

  it('equals', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.equals(new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit'))).toEqual(true);
    expect(str.equals(new JavaString('ipsum'))).toEqual(false);
  });

  it('indexOf', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.indexOf(new JavaString('ipsum'))).toEqual(6);
    expect(str.indexOf(new JavaString('ipsum'), 10)).toEqual(-1);
  });

  it('isEmpty', () => {
    const emptyStr = new JavaString('');
    expect(emptyStr.isEmpty()).toEqual(true);

    const str = new JavaString('foo bar');
    expect(str.isEmpty()).toEqual(false);
  });

  it('lastIndexOf', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem');
    expect(str.lastIndexOf(new JavaString('Lorem'))).toEqual(57);
    expect(str.lastIndexOf(new JavaString('Lorem'), 10)).toEqual(0);

    expect(str.lastIndexOf(new JavaString('foo'))).toEqual(-1);
  });

  it('matches', () => {
    const str = new JavaString('foo bar');

    expect(str.matches('foo')).toEqual(true);
    expect(str.matches('lorem')).toEqual(false);
    expect(str.matches('(foo|test)')).toEqual(true);
  });

  it('replace', () => {
    const str = new JavaString('foo foo bar');

    expect(str.replace('foo', 'bar').toString()).toEqual('bar bar bar');
    expect(str.replace('test', 'bar').toString()).toEqual('foo foo bar');
  });

  it('replaceFirst', () => {
    const str = new JavaString('foo foo bar');

    expect(str.replaceFirst('foo', 'bar').toString()).toEqual('bar foo bar');
    expect(str.replaceFirst('test', 'bar').toString()).toEqual('foo foo bar');
  });

  it('split', () => {
    const str = new JavaString('foo bar foo bar foo bar Foo');

    const splitStr = str.split(new JavaString(' '));
    expect(splitStr.length).toEqual(7);
    expect(splitStr.toJSON()).toEqual(['foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'Foo']);

    const splitStr2 = str.split(new JavaString('(foo)'));
    expect(splitStr2.length).toEqual(4);
    expect(splitStr2.toJSON()).toEqual(['', ' bar ', ' bar ', ' bar Foo']);
  });

  it('startsWith', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.startsWith(new JavaString('ipsum'))).toEqual(false);
    expect(str.startsWith(new JavaString('Lorem'))).toEqual(true);

    expect(str.startsWith(new JavaString('Lorem'), 10)).toEqual(false);
  });

  it('substring', () => {
    const str = new JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.substring(0).toString()).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
    expect(str.substring(0, 1).toString()).toEqual('L');
    expect(str.substring(6, 11).toString()).toEqual('ipsum');
  });

  it('toLowerCase', () => {
    const str = new JavaString('Foo BaR');
    expect(str.toLowerCase().toString()).toEqual('foo bar');
  });

  it('toUpperCase', () => {
    const str = new JavaString('Foo BaR');
    expect(str.toUpperCase().toString()).toEqual('FOO BAR');
  });

  it('trim', () => {
    const str = new JavaString('foo bar');
    expect(str.trim().toString()).toEqual('foo bar');

    const str2 = new JavaString('   foo bar');
    expect(str2.trim().toString()).toEqual('foo bar');

    const str3 = new JavaString('   foo bar      ');
    expect(str3.trim().toString()).toEqual('foo bar');

    const str4 = new JavaString('foo bar      ');
    expect(str4.trim().toString()).toEqual('foo bar');
  });
});
