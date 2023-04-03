"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const help_1 = require("./interactions/help");
const featureName = 'interactions';
module.exports = {
    name: featureName,
    run: async (context) => {
        if (context.parameters.options.help) {
            (0, help_1.run)(context);
        }
    },
};
//# sourceMappingURL=interactions.js.map