"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../velocity/util/index");
const mock_data_1 = require("./mock-data");
const type_definition_1 = require("../../../type-definition");
const stubInfo = {};
const mockInfo = stubInfo;
let util;
beforeEach(() => {
    const executionContext = {
        headers: { 'x-api-key': 'da-fake-key' },
        requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        appsyncErrors: [],
    };
    util = (0, index_1.create)(undefined, undefined, mockInfo, executionContext);
});
describe('$utils.rds.toJsonString', () => {
    it('should convert rds object to stringified JSON', () => {
        expect(util.rds.toJsonString(mock_data_1.mockedInputToRdsJsonString)).toEqual(mock_data_1.mockedOutputFromRdsJsonString);
    });
    it('handle input without sqlStatementResults input', () => {
        expect(util.rds.toJsonString('{}')).toEqual('[]');
    });
    it('handle invalid input', () => {
        expect(util.rds.toJsonString('')).toEqual('');
    });
});
describe('$utils.rds.toJsonObject', () => {
    const mockedOutputFromRdsJsonObject = JSON.parse(mock_data_1.mockedOutputFromRdsJsonString);
    it('should convert rds string to JSON object', () => {
        expect(util.rds.toJsonObject(mock_data_1.mockedInputToRdsJsonString)).toEqual(mockedOutputFromRdsJsonObject);
    });
    it('handle input without sqlStatementResults input', () => {
        expect(util.rds.toJsonObject('{}')).toHaveLength(0);
    });
    it('handle invalid input', () => {
        expect(util.rds.toJsonObject('')).toEqual('');
    });
});
//# sourceMappingURL=rds.test.js.map