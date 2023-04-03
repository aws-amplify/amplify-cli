"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showAllHelp = void 0;
const show_help_1 = require("./show-help");
const list_categories_1 = require("./list-categories");
const amplify_cli_core_1 = require("amplify-cli-core");
function showAllHelp(context) {
    context.print.info('');
    const header = 'amplify <command> <subcommand>';
    const commands = [
        {
            name: 'init',
            description: 'Initializes a new project, sets up deployment resources in the cloud, and makes your project ready for Amplify.',
        },
        {
            name: 'configure',
            description: 'Configures the attributes of your project for amplify-cli, such as switching front-end framework and adding/removing cloud-provider plugins.',
        },
        {
            name: 'push',
            description: 'Provisions cloud resources with the latest local developments.',
        },
        {
            name: 'pull',
            description: 'Fetch upstream backend environment definition changes from the cloud and updates the local environment to match that definition.',
        },
        {
            name: 'publish',
            description: 'Executes amplify push, and then builds and publishes client-side application for hosting.',
        },
        {
            name: 'serve',
            description: "Executes amplify push, and then executes the project's start command to test run the client-side application locally.",
        },
        {
            name: 'status [<category> ...]',
            description: 'Shows the state of local resources not yet pushed to the cloud (Create/Update/Delete).',
        },
        {
            name: 'status -v [<category> ...]',
            description: 'Shows the detailed verbose diff between local and deployed resources, including cloudformation-diff',
        },
        {
            name: 'delete',
            description: 'Deletes all of the resources tied to the project from the cloud.',
        },
        {
            name: '<category> add',
            description: 'Adds a resource for an Amplify category in your local backend',
        },
        {
            name: '<category> update',
            description: 'Update resource for an Amplify category in your local backend.',
        },
        {
            name: '<category> push',
            description: 'Provisions all cloud resources in a category with the latest local developments.',
        },
        {
            name: '<category> remove',
            description: 'Removes a resource for an Amplify category in your local backend.',
        },
        {
            name: '<category>',
            description: 'Displays subcommands of the specified Amplify category.',
        },
        {
            name: 'mock',
            description: 'Run mock server for testing categories locally.',
        },
        {
            name: 'codegen',
            description: 'Generates GraphQL statements(queries, mutations and eventHandlers) and type annotations.',
        },
        {
            name: 'env',
            description: 'Displays and manages environment related information for your Amplify project.',
        },
        {
            name: 'console',
            description: 'Opens the web console for the selected cloud resource.',
        },
        {
            name: 'logout',
            description: 'If using temporary cloud provider credentials, this logs out of the account.',
        },
    ];
    if (amplify_cli_core_1.isPackaged) {
        commands.push({
            name: 'upgrade',
            description: 'Download and install the latest version of the Amplify CLI',
        }, {
            name: 'uninstall',
            description: 'Remove all global Amplify configuration files and uninstall the Amplify CLI. This will not delete any Amplify projects.',
        });
    }
    (0, show_help_1.showHelp)(header, commands);
    context.print.info('');
    context.print.info(`where <category> is one of: ${(0, list_categories_1.listCategories)(context)}`);
    context.print.info('');
}
exports.showAllHelp = showAllHelp;
//# sourceMappingURL=show-all-help.js.map