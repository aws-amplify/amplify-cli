import { default as modelDirective } from './model';
import { default as keyDirective } from './key';
import { default as connectionDirective } from './connection';
const QUERY = `type Query {
  appsyncDummyQuery: String
}`;
export const directives = [modelDirective, keyDirective, connectionDirective, QUERY].join('\n');
