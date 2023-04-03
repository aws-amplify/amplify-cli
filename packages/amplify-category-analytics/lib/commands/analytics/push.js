"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.run = void 0;
const subcommand = 'push';
const category = 'analytics';
const run = async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    return amplify.pushResources(context, category, resourceName);
};
exports.run = run;
exports.name = subcommand;
//# sourceMappingURL=push.js.map