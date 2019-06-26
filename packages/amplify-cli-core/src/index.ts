import Input from './domain/input';
import { getPlugins, scan } from './plugin-manager';
import { getCommandLineInput, verifyInput } from './input-manager';
import { constructContext, persistContext } from './context-manager';
import { executeCommand } from './execution-manager';
import Context from './domain/context';
import diagnose from './commands/diagnose';
import plugin from './commands/plugin';
import version from './commands/version';

//entry from commandline
export async function run() : Promise<number> {
    try {
        let plugins = getPlugins();
        let input = getCommandLineInput(plugins);
        let verificationResult = verifyInput(plugins, input);

        if (!verificationResult.verified) {
            plugins = scan().plugins;
            input = getCommandLineInput(plugins);
            verificationResult = verifyInput(plugins, input);
            if (!verificationResult.verified) {
                throw new Error(verificationResult.message);
            }
        }

        const context = constructContext(plugins, input);
        await executeCommand(context);
        persistContext(context);
        return 0;
    } catch (e) {
        //ToDo: add logging to the core, and log execution errors using the unified core logging.
        console.log(e);
        return 1;
    }
}

//entry from library call
export function execute(input: Input) {
    try {
        let plugins = getPlugins();
        let verificationResult = verifyInput(plugins, input);

        if (!verificationResult.verified) {
            plugins = scan().plugins;
            verificationResult = verifyInput(plugins, input);
            if (!verificationResult.verified) {
                throw new Error(verificationResult.message);
            }
        }

        const context = constructContext(plugins, input);
        executeCommand(context);
        persistContext(context);
        return 0;
    } catch (e) {
        //ToDo: add logging to the core, and log execution errors using the unified core logging.
        console.log(e);
        return 1;
    }
}


export async function executeAmplifyCommand(context: Context) {
    switch (context.input.command) {
        case 'diagnose':
            await diagnose(context);
            break;
        case 'plugin':
            await plugin(context);
            break;
        case 'version':
            await version(context);
            break;
    }
}

