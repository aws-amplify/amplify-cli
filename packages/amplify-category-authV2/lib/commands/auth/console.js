'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.run = exports.subcommand = void 0;
const index_1 = __importDefault(require('../../index'));
exports.subcommand = 'console';
const run = async context => {
  await index_1.default.console(context);
};
exports.run = run;
//# sourceMappingURL=console.js.map
