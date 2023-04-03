"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.func = exports.schema = void 0;
//schema
var env = '${env}';
exports.schema = "\n#change: inserted \"<function-name>\" placeholder, the test will replace it with the actual function name\ntype Query {\n  echo(msg: String): String @function(name: \"<function-name>-".concat(env, "\")\n}\n");
//functions
exports.func = "\n//#error: context.done is deprecated, use async and return\nexports.handler = async event => {\n  return event.arguments.msg;\n};\n";
//queries
exports.query = "\n#extra\nquery Echo {\n  echo(msg: \"query message\")\n}\n";
exports.expected_result_query = {
    data: {
        echo: 'query message',
    },
};
//# sourceMappingURL=function-usage.js.map