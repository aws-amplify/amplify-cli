"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoneDataLoader = void 0;
class NoneDataLoader {
    load(request) {
        return request.payload || null;
    }
}
exports.NoneDataLoader = NoneDataLoader;
//# sourceMappingURL=index.js.map