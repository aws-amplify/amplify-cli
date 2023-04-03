"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("../../../velocity/value-mapper/string");
describe('JavaString', () => {
    it('replaceAll', () => {
        const str = new string_1.JavaString('foo bar foo bar foo bar Foo');
        const replacedStr = str.replaceAll('foo', 'baz');
        expect(replacedStr.toString()).toEqual('baz bar baz bar baz bar Foo');
        expect(replacedStr.toIdString()).toEqual('baz bar baz bar baz bar Foo');
        expect(replacedStr.toJSON()).toEqual('baz bar baz bar baz bar Foo');
    });
    it('length', () => {
        const str1 = new string_1.JavaString('foo');
        expect(str1.length().valueOf()).toEqual(3);
    });
    it('concat', () => {
        const str1 = new string_1.JavaString('foo');
        expect(str1.concat(new string_1.JavaString('bar')).toString()).toEqual('foobar');
    });
    it('contains', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.contains(new string_1.JavaString('ipsum'))).toEqual(true);
        expect(str.contains(new string_1.JavaString('DOLOR'))).toEqual(false);
    });
    it('endsWith', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.endsWith(new string_1.JavaString('ipsum'))).toEqual(false);
        expect(str.endsWith(new string_1.JavaString('elit'))).toEqual(true);
    });
    it('equals', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.equals(new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit'))).toEqual(true);
        expect(str.equals(new string_1.JavaString('ipsum'))).toEqual(false);
    });
    it('indexOf', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.indexOf(new string_1.JavaString('ipsum')).valueOf()).toEqual(6);
        expect(str.indexOf(new string_1.JavaString('ipsum'), 10).valueOf()).toEqual(-1);
    });
    it('isEmpty', () => {
        const emptyStr = new string_1.JavaString('');
        expect(emptyStr.isEmpty()).toEqual(true);
        const str = new string_1.JavaString('foo bar');
        expect(str.isEmpty()).toEqual(false);
    });
    it('lastIndexOf', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem');
        expect(str.lastIndexOf(new string_1.JavaString('Lorem')).valueOf()).toEqual(57);
        expect(str.lastIndexOf(new string_1.JavaString('Lorem'), 10).valueOf()).toEqual(0);
        expect(str.lastIndexOf(new string_1.JavaString('foo')).valueOf()).toEqual(-1);
    });
    it('matches', () => {
        const str = new string_1.JavaString('foo bar');
        expect(str.matches('foo')).toEqual(true);
        expect(str.matches('lorem')).toEqual(false);
        expect(str.matches('(foo|test)')).toEqual(true);
    });
    it('replace', () => {
        const str = new string_1.JavaString('foo foo bar');
        expect(str.replace('foo', 'bar').toString()).toEqual('bar bar bar');
        expect(str.replace('test', 'bar').toString()).toEqual('foo foo bar');
    });
    it('replaceFirst', () => {
        const str = new string_1.JavaString('foo foo bar');
        expect(str.replaceFirst('foo', 'bar').toString()).toEqual('bar foo bar');
        expect(str.replaceFirst('test', 'bar').toString()).toEqual('foo foo bar');
    });
    it('split', () => {
        const str = new string_1.JavaString('foo bar foo bar foo bar Foo');
        const splitStr = str.split(new string_1.JavaString(' '));
        expect(splitStr.length).toEqual(7);
        expect(splitStr.toJSON()).toEqual(['foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'Foo']);
        const splitStr2 = str.split(new string_1.JavaString('(foo)'));
        expect(splitStr2.length).toEqual(4);
        expect(splitStr2.toJSON()).toEqual(['', ' bar ', ' bar ', ' bar Foo']);
    });
    it('startsWith', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.startsWith(new string_1.JavaString('ipsum'))).toEqual(false);
        expect(str.startsWith(new string_1.JavaString('Lorem'))).toEqual(true);
        expect(str.startsWith(new string_1.JavaString('Lorem'), 10)).toEqual(false);
    });
    it('substring', () => {
        const str = new string_1.JavaString('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.substring(0).toString()).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit');
        expect(str.substring(0, 1).toString()).toEqual('L');
        expect(str.substring(6, 11).toString()).toEqual('ipsum');
    });
    it('toLowerCase', () => {
        const str = new string_1.JavaString('Foo BaR');
        expect(str.toLowerCase().toString()).toEqual('foo bar');
    });
    it('toUpperCase', () => {
        const str = new string_1.JavaString('Foo BaR');
        expect(str.toUpperCase().toString()).toEqual('FOO BAR');
    });
    it('trim', () => {
        const str = new string_1.JavaString('foo bar');
        expect(str.trim().toString()).toEqual('foo bar');
        const str2 = new string_1.JavaString('   foo bar');
        expect(str2.trim().toString()).toEqual('foo bar');
        const str3 = new string_1.JavaString('   foo bar      ');
        expect(str3.trim().toString()).toEqual('foo bar');
        const str4 = new string_1.JavaString('foo bar      ');
        expect(str4.trim().toString()).toEqual('foo bar');
    });
});
//# sourceMappingURL=string.test.js.map