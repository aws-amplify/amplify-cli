"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  comments: [Comment] @connection(limit: 50)\n}\n\ntype Comment @model {\n  id: ID!\n  content: String!\n}\n\n#connection/limit";
//# sourceMappingURL=connection-limit.js.map