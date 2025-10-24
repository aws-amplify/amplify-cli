'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createTriggersProperty = void 0;
const typescript_1 = __importDefault(require('typescript'));
const factory = typescript_1.default.factory;
const createTriggersProperty = (triggers) => {
  return factory.createPropertyAssignment(
    factory.createIdentifier('triggers'),
    factory.createObjectLiteralExpression(
      Object.entries(triggers).map(([key, value]) => {
        const functionName = value.source.split('/')[3];
        return factory.createPropertyAssignment(factory.createIdentifier(key), factory.createIdentifier(functionName));
      }),
      true,
    ),
  );
};
exports.createTriggersProperty = createTriggersProperty;
//# sourceMappingURL=lambda.js.map
