"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializer = void 0;
const createMap = (error) => Object.getOwnPropertyNames(error).reduce((obj, property) => {
    obj[property] = error[property];
    return obj;
}, {});
const serializer = (error) => JSON.stringify(createMap(error));
exports.serializer = serializer;
//# sourceMappingURL=error-serializer.js.map