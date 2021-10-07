import { InvalidDirectiveError } from '.';
import { collectDirectivesByType } from './collectDirectives';

export function getTableNameForModel(sdl: string, modelName: string): string {
  const directivesByType = collectDirectivesByType(sdl);
  const wasDirective = directivesByType?.[modelName].find(directive => directive.name.value === 'was');
  if (!wasDirective) {
    return modelName;
  }
  const wasNamed = wasDirective.arguments.find(arg => arg.name.value === 'name')?.value?.value;
  if (!wasNamed) {
    throw new InvalidDirectiveError(`Was directive must specify a name`);
  }
  return wasNamed;
}
