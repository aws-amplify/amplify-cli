"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
module.exports = {
    name: constants_1.category,
    run: async (context) => {
        if (/^win/.test(process.platform)) {
            try {
                const { run } = require(`./${constants_1.category}/${context.parameters.first}`);
                return run(context);
            }
            catch (e) {
                context.print.error('Command not found');
            }
        }
        const header = `amplify ${constants_1.category} <subcommand>`;
        const commands = [
            {
                name: 'add',
                description: `Takes you through a CLI flow to add an ${constants_1.category} resource to your local backend`,
            },
            {
                name: 'update',
                description: `Takes you through steps in the CLI to update an ${constants_1.category} resource`,
            },
            {
                name: 'push',
                description: `Provisions only ${constants_1.category} cloud resources with the latest local developments`,
            },
            {
                name: 'remove',
                description: `Removes ${constants_1.category} resource from your local backend. The resource is removed from the cloud on the next push command.`,
            },
            {
                name: 'console',
                description: `Opens the web console for the ${constants_1.category} category`,
            },
        ];
        context.amplify.showHelp(header, commands);
        context.print.info('');
    },
};
//# sourceMappingURL=geo.js.map