import { stateManager } from '@aws-amplify/amplify-cli-core';
import { categoryName } from '../../../constants';

export const isFunctionPushed = (functionName: string): boolean =>
  stateManager.getCurrentMeta()?.[categoryName]?.[functionName] !== undefined;
