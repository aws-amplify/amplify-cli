"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const to_json_1 = require("../../../velocity/value-mapper/to-json");
describe('Velocity - ValueMapper toJSON', () => {
    it('should call toJSON if the value object has method toJSON', () => {
        const JSON_VALUE = 'MOCK_JSON_VALUE';
        const testObj = {
            toJSON: jest.fn().mockReturnValue(JSON_VALUE),
        };
        expect((0, to_json_1.toJSON)(testObj)).toEqual(JSON_VALUE);
        expect(testObj.toJSON).toHaveBeenCalled();
    });
    it('should not call toJSON if the object is null', () => {
        expect((0, to_json_1.toJSON)(null)).toEqual(null);
    });
    it('should return the source object if it doesnot implement toJSON', () => {
        const testObj = {
            foo: 'Foo',
        };
        expect((0, to_json_1.toJSON)(testObj)).toEqual(testObj);
    });
});
//# sourceMappingURL=to-json.test.js.map