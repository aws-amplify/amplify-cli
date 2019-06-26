import Context from './domain/context';
import Input from './domain/input';
import PluginCollection from './domain/plugin-collection';
import { attachGluegunExtentions } from './gluegun-helper';

export function constructContext(plugins: PluginCollection, input: Input): Context {
    const context = new Context(plugins, input);

    attachGluegunExtentions(context);

    return context;
}

export function persistContext(context: Context): void {
    //write to the backend and current backend
    //and get the frontend plugin to write to the config files.
}

