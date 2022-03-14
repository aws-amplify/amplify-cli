import { InvalidDirectiveError } from '.';
import { collectDirectivesByType } from './collectDirectives';

// this must be kept in sync with the directive name defined in the MapsToTransformer
// it probably won't change though as this would be a breaking API change
const directiveName = 'mapsTo';

/**
 * @param sdl The GraphQL schema as a string
 * @param modelName The model name to translate
 * @returns The modelName if the type does not have an @mapsTo directive on it. Otherwise it returns the name specified in @mapsTo
 */
export function getTableNameForModel(sdl: string, modelName: string): string {
  const directivesByType = collectDirectivesByType(sdl);
  const mapsToDirective = directivesByType?.[modelName]?.find(directive => directive.name.value === directiveName);
  if (!mapsToDirective) {
    return modelName;
  }
  const originalName = mapsToDirective.arguments.find(arg => arg.name.value === 'name')?.value?.value;
  if (!originalName) {
    throw new InvalidDirectiveError(`@${directiveName} directive must specify a name`);
  }
  return originalName;
}
