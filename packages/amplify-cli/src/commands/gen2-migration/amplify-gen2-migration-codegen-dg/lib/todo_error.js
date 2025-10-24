'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createTodoError = void 0;
const typescript_1 = __importDefault(require('typescript'));
const factory = typescript_1.default.factory;
const createTodoError = (todoMessage) =>
  factory.createThrowStatement(
    factory.createNewExpression(factory.createIdentifier('Error'), undefined, [factory.createStringLiteral(`TODO: ${todoMessage}`)]),
  );
exports.createTodoError = createTodoError;
//# sourceMappingURL=todo_error.js.map
