import { InvalidDirectiveError } from '.';
import { collectDirectivesByType } from './collectDirectives';

// this must be kept in sync with the directive name defined in the OriginalTransformer
// it probably won't change though as this would be a breaking API change
const directiveName = 'original';

/**
 * @param sdl The GraphQL schema as a string
 * @param modelName The model name to translate
 * @returns The modelName if the type does not have an @original directive on it. Otherwise it returns the name specified in @original
 */
export function getTableNameForModel(sdl: string, modelName: string): string {
  const directivesByType = collectDirectivesByType(sdl);
  const originalDirective = directivesByType?.[modelName]?.find(directive => directive.name.value === directiveName);
  if (!originalDirective) {
    return modelName;
  }
  const originalName = originalDirective.arguments.find(arg => arg.name.value === 'name')?.value?.value;
  if (!originalName) {
    throw new InvalidDirectiveError(`Was directive must specify a name`);
  }
  return originalName;
}
