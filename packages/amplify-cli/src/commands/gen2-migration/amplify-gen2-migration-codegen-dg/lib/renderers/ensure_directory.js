'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.EnsureDirectory = void 0;
const promises_1 = __importDefault(require('node:fs/promises'));
class EnsureDirectory {
  constructor(directory) {
    this.directory = directory;
    this.render = async () => {
      await promises_1.default.mkdir(this.directory, { recursive: true });
    };
  }
}
exports.EnsureDirectory = EnsureDirectory;
//# sourceMappingURL=ensure_directory.js.map
