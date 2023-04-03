"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const help_1 = require("./predictions/help");
const categoryName = 'predictions';
module.exports = {
    name: categoryName,
    alias: ['Predictions'],
    run: async (context) => {
        if (context.parameters.options.help) {
            (0, help_1.run)(context);
        }
    },
};
//# sourceMappingURL=predictions.js.map