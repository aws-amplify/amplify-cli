'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.newLineIdentifier = void 0;
const typescript_1 = __importDefault(require('typescript'));
const factory = typescript_1.default.factory;
exports.newLineIdentifier = factory.createIdentifier('\n');
//# sourceMappingURL=ts_factory_utils.js.map
