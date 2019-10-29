import * as types from './types';

export * from './types';
import generate from './generate';
export { generateMutations, generateSubscriptions, generateQueries } from './generateAllOperations';
export default generate;
