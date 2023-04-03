"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appsync_scalars_1 = require("../../schema/appsync-scalars");
describe('AWSJSON parse', () => {
    it('Should reject an invalid json encoded object', () => {
        function parse() {
            appsync_scalars_1.scalars.AWSJSON.parseValue('{Foo: "Not Valid"}');
        }
        expect(parse).toThrowErrorMatchingSnapshot();
    });
    it('Should reject a non json string', () => {
        function parse() {
            appsync_scalars_1.scalars.AWSJSON.parseValue('hello world');
        }
        expect(parse).toThrowErrorMatchingSnapshot();
    });
    it('Should reject a non json boolean', () => {
        function parse() {
            appsync_scalars_1.scalars.AWSJSON.parseValue(true);
        }
        expect(parse).toThrowErrorMatchingSnapshot();
    });
    it('Should reject a non json int', () => {
        function parse() {
            appsync_scalars_1.scalars.AWSJSON.parseValue(1);
        }
        expect(parse).toThrowErrorMatchingSnapshot();
    });
    it('Should accept a json encoded object', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.parseValue('{"Foo": "Bar"}')).toMatchObject({
            Foo: 'Bar',
        });
    });
    it('Should accept a json string', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.parseValue('"Hello world"')).toEqual('Hello world');
    });
    it('Should accept a json boolean', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.parseValue('true')).toEqual(true);
    });
    it('Should accept a json int', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.parseValue('1')).toEqual(1);
    });
});
describe('AWSJSON serialize', () => {
    it('Should serialize an obkect', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.serialize({ foo: 'Bar' })).toEqual('{"foo":"Bar"}');
    });
    it('Should serialize a boolean', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.serialize(true)).toEqual('true');
    });
    it('Should serialize an integer', () => {
        expect(appsync_scalars_1.scalars.AWSJSON.serialize(1)).toEqual('1');
    });
});
//# sourceMappingURL=AWSJSON.test.js.map