import { Context } from './domain/context';
import { Input } from './domain/input';
import { PluginPlatform } from './domain/plugin-platform';
import { attachExtentions } from './context-extensions';

export function constructContext(pluginPlatform: PluginPlatform, input: Input): Context {
  const context = new Context(pluginPlatform, input);

  attachExtentions(context);

  return context;
}

export function persistContext(context: Context): void {
  // write to the backend and current backend
  // and get the frontend plugin to write to the config files.
}
