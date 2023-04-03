"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const run = async (context) => {
    context.print.info(context.amplify.listCategories(context));
};
exports.run = run;
//# sourceMappingURL=categories.js.map